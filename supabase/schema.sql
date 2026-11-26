-- FoodLoop MVP schema. Run on a new Supabase project.
-- Admin roles are not self-assignable through public signup.
create extension if not exists pgcrypto;
create type public.foodloop_role as enum ('donor','ngo','volunteer');
create type public.verification_status as enum ('pending','verified','rejected','suspended');
create type public.donation_status as enum ('listed','requested','accepted','collected','distributed','expired','cancelled');
create type public.food_type as enum ('vegetarian','non_vegetarian','vegan');
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text not null,role public.foodloop_role not null default 'donor',created_at timestamptz not null default now());
create table public.organizations(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id) on delete cascade,name text not null,organization_type text not null check(organization_type in ('business','ngo','community_kitchen','event_organizer')),city text not null,state text not null,address text,verification_status public.verification_status not null default 'pending',created_at timestamptz not null default now());
create table public.donations(id uuid primary key default gen_random_uuid(),donor_id uuid not null references public.profiles(id),title text not null,category text not null,food_type public.food_type not null,quantity numeric(12,2) not null check(quantity>0),unit text not null,prepared_at timestamptz not null,safe_until timestamptz not null,pickup_address text not null,city text not null,state text not null,notes text not null default '',status public.donation_status not null default 'listed',created_at timestamptz not null default now(),constraint safe_window_after_preparation check(safe_until>prepared_at));
create table public.donation_claims(id uuid primary key default gen_random_uuid(),donation_id uuid not null references public.donations(id) on delete cascade,ngo_id uuid not null references public.profiles(id),status text not null default 'requested' check(status in('requested','accepted','rejected','withdrawn')),created_at timestamptz not null default now(),unique(donation_id,ngo_id));
create index donations_status_city_idx on public.donations(status,city);
create index donations_donor_created_idx on public.donations(donor_id,created_at desc);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare chosen_role public.foodloop_role;
begin
chosen_role:=case when new.raw_user_meta_data->>'role' in('donor','ngo','volunteer') then (new.raw_user_meta_data->>'role')::public.foodloop_role else 'donor'::public.foodloop_role end;
insert into public.profiles(id,full_name,role) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'full_name',''),split_part(new.email,'@',1)),chosen_role);return new;end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.donations enable row level security;
alter table public.donation_claims enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using(id=auth.uid());
-- Intentionally no client policy to change a profile role.
create policy organizations_owner_read on public.organizations for select to authenticated using(owner_id=auth.uid());
create policy organizations_owner_create on public.organizations for insert to authenticated with check(owner_id=auth.uid());
create policy donor_read_own_donations on public.donations for select to authenticated using(donor_id=auth.uid());
create policy ngo_read_listed_donations on public.donations for select to authenticated using(status='listed' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ngo'));
create policy donor_create_donation on public.donations for insert to authenticated with check(donor_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='donor'));
-- Donation status changes are intentionally withheld from direct client updates.
-- Add narrowly-scoped, server-validated RPCs for each allowed lifecycle transition.
create policy ngo_read_own_claims on public.donation_claims for select to authenticated using(ngo_id=auth.uid());
create policy donor_read_claims_for_own_donations on public.donation_claims for select to authenticated using(exists(select 1 from public.donations d where d.id=donation_id and d.donor_id=auth.uid()));
create policy ngo_request_listed_donation on public.donation_claims for insert to authenticated with check(ngo_id=auth.uid() and status='requested' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ngo') and exists(select 1 from public.donations d where d.id=donation_id and d.status='listed' and d.safe_until>now()));
-- Production follow-up required: admin verification, donor claim decisions, partial allocations,
-- QR/OTP handover, distribution evidence, immutable impact ledger, certificates and audit RPCs.


-- Milestone 2: richer member profiles and organisation onboarding.
alter table public.profiles
  add column if not exists phone text not null default '',
  add column if not exists city text not null default '',
  add column if not exists state text not null default '',
  add column if not exists bio text not null default '';

alter table public.organizations
  add column if not exists phone text not null default '',
  add column if not exists contact_email text not null default '';

-- Signup creates the profile and, when supplied, the organisation record.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  chosen_role public.foodloop_role;
  org_name text;
  org_type text;
begin
  chosen_role:=case
    when new.raw_user_meta_data->>'role' in('donor','ngo','volunteer')
      then (new.raw_user_meta_data->>'role')::public.foodloop_role
    else 'donor'::public.foodloop_role
  end;
  insert into public.profiles(id,full_name,role,phone,city,state,bio)
  values(
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''),split_part(new.email,'@',1)),
    chosen_role,
    coalesce(new.raw_user_meta_data->>'phone',''),
    coalesce(new.raw_user_meta_data->>'city',''),
    coalesce(new.raw_user_meta_data->>'state',''),
    coalesce(new.raw_user_meta_data->>'bio','')
  );
  org_name:=nullif(new.raw_user_meta_data->>'organization_name','');
  org_type:=new.raw_user_meta_data->>'organization_type';
  if org_name is not null and org_type in('business','ngo','community_kitchen','event_organizer') then
    insert into public.organizations(owner_id,name,organization_type,city,state,address,phone,contact_email)
    values(new.id,org_name,org_type,coalesce(new.raw_user_meta_data->>'city',''),coalesce(new.raw_user_meta_data->>'state',''),coalesce(new.raw_user_meta_data->>'address',''),coalesce(new.raw_user_meta_data->>'phone',''),coalesce(new.email,''));
  end if;
  return new;
end;
$$;

-- Users can update safe profile fields only through this function.
-- The role and account identity are deliberately not user-editable.
create or replace function public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_city text,
  p_state text,
  p_bio text
) returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  update public.profiles
  set full_name=left(trim(p_full_name),120),
      phone=left(trim(p_phone),30),
      city=left(trim(p_city),100),
      state=left(trim(p_state),100),
      bio=left(trim(coalesce(p_bio,'')),500)
  where id=auth.uid();
  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;
revoke all on function public.update_my_profile(text,text,text,text,text) from public;
grant execute on function public.update_my_profile(text,text,text,text,text) to authenticated;
