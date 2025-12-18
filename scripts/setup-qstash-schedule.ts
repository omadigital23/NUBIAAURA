import { config } from "dotenv";
import { Client } from "@upstash/qstash";

// Load environment variables from .env.local
config({ path: ".env.local" });

/**
 * Script pour configurer le schedule QStash
 * Automatise les mises à jour de statut des commandes
 * 
 * Usage: npx tsx scripts/setup-qstash-schedule.ts
 */

async function setupQStashSchedule() {
    // Vérifier que les variables d'environnement sont présentes
    if (!process.env.QSTASH_TOKEN) {
        console.error("❌ QSTASH_TOKEN n'est pas défini dans .env.local");
        process.exit(1);
    }

    if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
        console.error("❌ NEXT_PUBLIC_APP_URL ou NEXT_PUBLIC_SITE_URL n'est pas défini dans .env.local");
        process.exit(1);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

    const client = new Client({
        token: process.env.QSTASH_TOKEN,
    });

    try {
        console.log("🚀 Configuration du schedule QStash...");
        console.log(`📍 URL de destination: ${appUrl}/api/cron/update-order-status`);

        // Créer un schedule pour mettre à jour les statuts toutes les 6 heures
        const schedule = await client.schedules.create({
            destination: `${appUrl}/api/cron/update-order-status`,
            cron: "0 */6 * * *", // Toutes les 6 heures
        });

        console.log("✅ Schedule créé avec succès!");
        console.log("📋 Détails du schedule:");
        console.log(`   - ID: ${schedule.scheduleId}`);
        console.log(`   - Cron: 0 */6 * * * (toutes les 6 heures)`);
        console.log(`   - Destination: ${appUrl}/api/cron/update-order-status`);
        console.log("\n💡 Le schedule est maintenant actif et s'exécutera automatiquement.");
        console.log("🔍 Vous pouvez le voir sur: https://console.upstash.com/qstash");

    } catch (error: any) {
        console.error("❌ Erreur lors de la création du schedule:", error.message);

        if (error.message?.includes("already exists")) {
            console.log("\n💡 Un schedule existe déjà pour cette destination.");
            console.log("   Vous pouvez le gérer sur: https://console.upstash.com/qstash");
        }

        process.exit(1);
    }
}

// Exécuter le script
setupQStashSchedule();
