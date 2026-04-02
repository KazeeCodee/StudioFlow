import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const raw = readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getArg(flag, fallback = "") {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

function requireArg(flag, label) {
  const value = getArg(flag);

  if (!value) {
    throw new Error(`Falta ${label}. Usá ${flag} para indicarlo.`);
  }

  return value;
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable ${name}.`);
  }

  return value;
}

async function findAuthUserByEmail(adminClient, email) {
  let page = 1;

  while (true) {
    const result = await adminClient.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    const found = result.data.users.find((user) => user.email === email);

    if (found) {
      return found;
    }

    if (result.data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

async function main() {
  loadEnvFile(path.resolve(".env.local"));

  const email = requireArg("--email", "el email del admin");
  const password = requireArg("--password", "la contraseña inicial");
  const fullName = requireArg("--name", "el nombre completo");
  const role = getArg("--role", "super_admin");
  const phone = getArg("--phone");

  if (!["super_admin", "admin", "operator"].includes(role)) {
    throw new Error("El rol debe ser super_admin, admin u operator.");
  }

  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const databaseUrl = getRequiredEnv("DATABASE_URL");

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const sql = postgres(databaseUrl, { prepare: false });

  try {
    const existingUser = await findAuthUserByEmail(adminClient, email);

    let userId = existingUser?.id;

    if (existingUser) {
      const updateResult = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (updateResult.error) {
        throw new Error(updateResult.error.message);
      }
    } else {
      const createResult = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (createResult.error || !createResult.data.user) {
        throw new Error(createResult.error?.message ?? "No se pudo crear el usuario.");
      }

      userId = createResult.data.user.id;
    }

    if (!userId) {
      throw new Error("No se pudo resolver el usuario autenticado.");
    }

    await sql`
      insert into profiles (id, full_name, email, phone, role, status)
      values (${userId}, ${fullName}, ${email}, ${phone || null}, ${role}, 'active')
      on conflict (id) do update
      set
        full_name = excluded.full_name,
        email = excluded.email,
        phone = excluded.phone,
        role = excluded.role,
        status = 'active',
        updated_at = now()
    `;

    console.log(
      [
        "Bootstrap completado.",
        `Usuario: ${email}`,
        `Rol: ${role}`,
        "Ya podés iniciar sesión en /login con esas credenciales.",
      ].join("\n"),
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
