/**
 * Utilitaire pour calculer les délais de livraison et de retour
 * basés sur la localisation (Sénégal vs International)
 * 
 * DÉLAIS OFFICIELS NUBIA AURA:
 * - Sénégal Dakar: Dans la journée (same-day)
 * - Sénégal autres régions: 1-3 jours
 * - International: 7-14 jours
 * - Sur-mesure (tous pays): 2-3 semaines
 * - Retours Sénégal: 3 jours
 * - Retours International: 14 jours
 */

/**
 * Vérifie si un pays est le Sénégal
 */
export function isSenegal(country: string): boolean {
    const normalized = country.toLowerCase().trim();
    return normalized === 'senegal' ||
        normalized === 'sénégal' ||
        normalized === 'sn' ||
        normalized === 'sen';
}

/**
 * Vérifie si la ville est Dakar
 */
export function isDakar(city: string): boolean {
    const normalized = city.toLowerCase().trim();
    return normalized === 'dakar' ||
        normalized.includes('dakar');
}

/**
 * Calcule la durée de livraison en jours selon le pays, la ville et le type de commande
 * 
 * @param country - Pays de livraison
 * @param city - Ville de livraison (optionnel)
 * @param isCustomOrder - true si commande sur-mesure, false si achat normal
 * @returns Nombre de jours pour la livraison
 * 
 * Règles:
 * - Sénégal Dakar: Dans la journée (0-1 jour)
 * - Sénégal autres régions: 1-3 jours
 * - International: 7-14 jours
 * - Sur-mesure (tous pays): 14-21 jours (2-3 semaines)
 */
export function calculateDeliveryDuration(
    country: string,
    cityOrIsCustom?: string | boolean,
    isCustomOrder: boolean = false
): number {
    // Handle overloaded parameters
    let city = '';
    let customOrder = isCustomOrder;

    if (typeof cityOrIsCustom === 'boolean') {
        customOrder = cityOrIsCustom;
    } else if (typeof cityOrIsCustom === 'string') {
        city = cityOrIsCustom;
    }

    if (customOrder) {
        // Commandes sur-mesure: 14-21 jours (2-3 semaines)
        return Math.floor(Math.random() * 8) + 14;
    }

    if (isSenegal(country)) {
        if (isDakar(city)) {
            // Dakar: Same-day (0-1 jour)
            return Math.random() < 0.8 ? 0 : 1;
        }
        // Sénégal autres régions: 1-3 jours
        return Math.floor(Math.random() * 3) + 1;
    }

    // International: 7-14 jours
    return Math.floor(Math.random() * 8) + 7;
}

/**
 * Obtient la plage de livraison en texte
 */
export function getDeliveryRangeText(
    country: string,
    cityOrIsCustom?: string | boolean,
    isCustomOrderOrLocale?: boolean | string,
    locale: string = 'fr'
): string {
    // Handle overloaded parameters
    let city = '';
    let customOrder = false;
    let lang = locale;

    if (typeof cityOrIsCustom === 'boolean') {
        customOrder = cityOrIsCustom;
        if (typeof isCustomOrderOrLocale === 'string') {
            lang = isCustomOrderOrLocale;
        }
    } else if (typeof cityOrIsCustom === 'string') {
        city = cityOrIsCustom;
        if (typeof isCustomOrderOrLocale === 'boolean') {
            customOrder = isCustomOrderOrLocale;
        } else if (typeof isCustomOrderOrLocale === 'string') {
            lang = isCustomOrderOrLocale;
        }
    }

    if (customOrder) {
        return lang === 'fr' ? '2-3 semaines' : '2-3 weeks';
    }

    if (isSenegal(country)) {
        if (isDakar(city)) {
            return lang === 'fr' ? 'Dans la journée' : 'Same day';
        }
        return lang === 'fr' ? '1-3 jours' : '1-3 days';
    }

    return lang === 'fr' ? '7-14 jours' : '7-14 days';
}

/**
 * Calcule la date limite pour demander un retour
 * 
 * @param country - Pays de livraison
 * @param deliveredAt - Date de livraison
 * @returns Date limite pour retour
 * 
 * Règles:
 * - Sénégal: 3 jours après réception
 * - International: 14 jours après réception
 */
export function calculateReturnDeadline(
    country: string,
    deliveredAt: Date
): Date {
    const deadline = new Date(deliveredAt);

    if (isSenegal(country)) {
        // Sénégal: 3 jours
        deadline.setDate(deadline.getDate() + 3);
    } else {
        // International: 14 jours
        deadline.setDate(deadline.getDate() + 14);
    }

    return deadline;
}

/**
 * Obtient le nombre de jours pour la période de retour
 * 
 * @param country - Pays de livraison
 * @returns Nombre de jours pour retour
 */
export function getReturnPeriodDays(country: string): number {
    return isSenegal(country) ? 3 : 14;
}

/**
 * Vérifie si une demande de retour est dans les délais
 * 
 * @param country - Pays de livraison
 * @param deliveredAt - Date de livraison
 * @param requestDate - Date de la demande de retour (par défaut: maintenant)
 * @returns true si dans les délais, false sinon
 */
export function isReturnEligible(
    country: string,
    deliveredAt: Date,
    requestDate: Date = new Date()
): boolean {
    const deadline = calculateReturnDeadline(country, deliveredAt);
    return requestDate <= deadline;
}
