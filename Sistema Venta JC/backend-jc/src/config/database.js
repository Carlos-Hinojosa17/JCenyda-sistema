require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Las variables de entorno SUPABASE_URL y SUPABASE_KEY son requeridas.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Cliente de Supabase inicializado correctamente.');

module.exports = supabase;
