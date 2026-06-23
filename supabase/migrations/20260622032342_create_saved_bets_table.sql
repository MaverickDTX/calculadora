/*
# Create saved_bets table

1. New Tables
- `saved_bets`
- `id` (uuid, primary key)
- `label` (text) — nome do mercado/label da aposta
- `market` (text) — tipo de mercado
- `prob` (numeric, nullable) — probabilidade justa estimada
- `fair` (numeric, nullable) — odd justa
- `your` (numeric) — odd oferecida pela casa
- `your_eff` (numeric) — odd efetiva (com boost aplicado)
- `ev` (numeric) — valor esperado
- `kfull` (numeric) — Kelly cheio
- `kadj` (numeric) — Kelly ajustado final
- `stake_units` (numeric) — stake em unidades
- `stake_reais` (numeric) — stake em reais
- `confidence` (text) — nível de confiança (high/mid/low)
- `method` (text) — método de de-vig usado
- `decomp` (text) — descrição da decomposição
- `created_at` (timestamptz)

2. Security
- Enable RLS on `saved_bets`.
- Allow anon + authenticated CRUD since this is a single-tenant app (no auth required).
*/

CREATE TABLE IF NOT EXISTS saved_bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  market text NOT NULL,
  prob numeric,
  fair numeric,
  your numeric NOT NULL,
  your_eff numeric NOT NULL,
  ev numeric NOT NULL,
  kfull numeric NOT NULL,
  kadj numeric NOT NULL,
  stake_units numeric NOT NULL,
  stake_reais numeric NOT NULL,
  confidence text NOT NULL,
  method text NOT NULL,
  decomp text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_saved_bets" ON saved_bets;
CREATE POLICY "anon_select_saved_bets" ON saved_bets FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_saved_bets" ON saved_bets;
CREATE POLICY "anon_insert_saved_bets" ON saved_bets FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_saved_bets" ON saved_bets;
CREATE POLICY "anon_update_saved_bets" ON saved_bets FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_saved_bets" ON saved_bets;
CREATE POLICY "anon_delete_saved_bets" ON saved_bets FOR DELETE
TO anon, authenticated USING (true);
