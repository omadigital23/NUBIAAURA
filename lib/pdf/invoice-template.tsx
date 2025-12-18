import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts (using default)
Font.registerHyphenationCallback((word) => [word]);

// Styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#1a1a1a',
        paddingBottom: 20,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    tagline: {
        fontSize: 8,
        color: '#666',
        marginTop: 4,
    },
    invoiceInfo: {
        textAlign: 'right',
    },
    invoiceTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    invoiceNumber: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: 100,
        color: '#666',
    },
    value: {
        flex: 1,
        color: '#1a1a1a',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tableHeaderCell: {
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    colProduct: { flex: 3 },
    colQty: { width: 60, textAlign: 'center' },
    colPrice: { width: 80, textAlign: 'right' },
    colTotal: { width: 80, textAlign: 'right' },
    totals: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
        width: 200,
    },
    totalLabel: {
        flex: 1,
        textAlign: 'right',
        paddingRight: 10,
        color: '#666',
    },
    totalValue: {
        width: 80,
        textAlign: 'right',
        color: '#1a1a1a',
    },
    grandTotal: {
        fontWeight: 'bold',
        fontSize: 14,
        borderTopWidth: 2,
        borderTopColor: '#1a1a1a',
        paddingTop: 8,
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#999',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 15,
    },
    paymentBadge: {
        backgroundColor: '#22c55e',
        color: '#fff',
        padding: '4 8',
        borderRadius: 4,
        fontSize: 8,
        marginTop: 4,
    },
    pendingBadge: {
        backgroundColor: '#f59e0b',
        color: '#fff',
        padding: '4 8',
        borderRadius: 4,
        fontSize: 8,
        marginTop: 4,
    },
});

interface InvoiceItem {
    name: string;
    quantity: number;
    price: number;
}

interface InvoiceData {
    orderNumber: string;
    orderDate: string;
    customer: {
        name: string;
        email: string;
        phone?: string;
        address: string;
        city: string;
        country: string;
    };
    items: InvoiceItem[];
    subtotal: number;
    shipping: number;
    discount?: number;
    total: number;
    paymentStatus: string;
    paymentMethod: string;
}

const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const InvoiceDocument = ({ data }: { data: InvoiceData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.logo}>NUBIA AURA</Text>
                    <Text style={styles.tagline}>Mode Africaine Éthique & Sur-Mesure</Text>
                </View>
                <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceTitle}>FACTURE</Text>
                    <Text style={styles.invoiceNumber}>N° {data.orderNumber}</Text>
                    <Text style={styles.invoiceNumber}>{formatDate(data.orderDate)}</Text>
                </View>
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Facturer à</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nom:</Text>
                    <Text style={styles.value}>{data.customer.name}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{data.customer.email}</Text>
                </View>
                {data.customer.phone && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Téléphone:</Text>
                        <Text style={styles.value}>{data.customer.phone}</Text>
                    </View>
                )}
                <View style={styles.row}>
                    <Text style={styles.label}>Adresse:</Text>
                    <Text style={styles.value}>
                        {data.customer.address}, {data.customer.city}, {data.customer.country}
                    </Text>
                </View>
            </View>

            {/* Payment Status */}
            <View style={styles.section}>
                <View style={styles.row}>
                    <Text style={styles.label}>Paiement:</Text>
                    <Text style={styles.value}>{data.paymentMethod}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Statut:</Text>
                    <View style={data.paymentStatus === 'paid' ? styles.paymentBadge : styles.pendingBadge}>
                        <Text>{data.paymentStatus === 'paid' ? 'PAYÉ' : 'EN ATTENTE'}</Text>
                    </View>
                </View>
            </View>

            {/* Items Table */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Articles</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colProduct]}>Produit</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPrice]}>Prix unit.</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                    </View>
                    {data.items.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.colProduct}>{item.name}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>{formatCurrency(item.price)}</Text>
                            <Text style={styles.colTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Totals */}
            <View style={styles.totals}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Sous-total:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Livraison:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(data.shipping)}</Text>
                </View>
                {data.discount && data.discount > 0 && (
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Réduction:</Text>
                        <Text style={styles.totalValue}>-{formatCurrency(data.discount)}</Text>
                    </View>
                )}
                <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={styles.totalLabel}>TOTAL:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(data.total)}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>NUBIA AURA - Mode Africaine Éthique & Sur-Mesure</Text>
                <Text>Dakar, Sénégal | contact@nubiaaura.com | +221 77 XXX XX XX</Text>
                <Text style={{ marginTop: 8 }}>Merci pour votre confiance !</Text>
            </View>
        </Page>
    </Document>
);

export type { InvoiceData, InvoiceItem };
