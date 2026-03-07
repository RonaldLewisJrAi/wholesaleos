create extension if not exists pg_net;
create schema if not exists util;
create or replace function util.get_vault_secret(secret_name text) returns text language plpgsql security definer
set search_path = public,
    extensions as $$
declare secret_value text;
begin
select decrypted_secret into secret_value
from vault.decrypted_secrets
where name = secret_name;
return coalesce(secret_value, '');
end;
$$;
create or replace function public.notify_update_reputation() returns trigger language plpgsql security definer
set search_path = public,
    extensions as $$
declare endpoint_url text := 'https://hhjzoufgoifvihuydnxq.functions.supabase.co/functions/v1/update-reputation';
webhook_token text := util.get_vault_secret('edge_function_webhook_token');
begin perform net.http_post(
    url := endpoint_url,
    headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer ' || webhook_token
    ),
    body := jsonb_build_object(
        'investor_id',
        NEW.investor_id,
        'deal_id',
        NEW.deal_id,
        'title_company_id',
        NEW.title_company_id
    )
);
return NEW;
end;
$$;
drop trigger if exists closing_verification_webhook on public.closing_verifications;
create trigger closing_verification_webhook
after
insert on public.closing_verifications for each row execute function public.notify_update_reputation();