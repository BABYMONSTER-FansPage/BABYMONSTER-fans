drop policy if exists "fans update own nickname" on public.profiles;
create policy "fans update own nickname" on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

grant update (nickname) on public.profiles to authenticated;
