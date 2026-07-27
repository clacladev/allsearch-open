create or replace function get_user_session_info(target_user_id uuid)
returns table (
  id uuid,
  email text,
  last_sign_in_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select
    u.id,
    u.email::text,
    u.last_sign_in_at,
    s.max_session_updated_at as last_active_at,
    u.created_at
  from auth.users u
  left join (
    select
      sess.user_id,
      max(sess.updated_at) as max_session_updated_at
    from auth.sessions sess
    where sess.user_id = target_user_id
    group by sess.user_id
  ) s on s.user_id = u.id
  where u.id = target_user_id;
end;
$$;

create or replace function get_user_session_info_bulk(target_user_ids uuid[])
returns table (
  id uuid,
  email text,
  last_sign_in_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select
    u.id,
    u.email::text,
    u.last_sign_in_at,
    s.max_session_updated_at as last_active_at,
    u.created_at
  from auth.users u
  left join (
    select
      sess.user_id,
      max(sess.updated_at) as max_session_updated_at
    from auth.sessions sess
    where sess.user_id = any(target_user_ids)
    group by sess.user_id
  ) s on s.user_id = u.id
  where u.id = any(target_user_ids);
end;
$$;
