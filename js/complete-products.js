/**
 * Complete V5 Medical Product Database
 * Precise Image Mapping Version
 * @version 3.5.0
 * @updated 2026-08-22
 * [3.5.0] 10 个 SKU 从 default-product.jpg 换成独立品牌卡片图；
 *         新增 categoryProfiles：认证/规格/描述按分类差异化
 *         （pharmaceutical-packaging 不再标注 Sterile/FDA）
 * [3.4.0] 新增 pharmaceutical-packaging 分类（药盒/说明书/标签/防伪标签/吸塑托盘）
 */

const completeProductDatabase = {
    metadata: {
        version: '4.0.0',
        lastUpdated: '2026-09-04',
        totalProducts: 107
    },
    
    categories: {
        'surgical-sutures': 'Surgical Sutures',
        'surgical-instruments': 'Surgical Instruments', 
        'gauze-dressings': 'Gauze Dressings',
        'protective-equipment': 'Protective Equipment',
        'surgical-packs': 'Surgical Packs',
        'injection-infusion': 'Injection & Infusion',
        'dental-products': 'Dental Products',
        'pharmaceutical-packaging': 'Pharmaceutical Packaging',
        'peptide-raw-materials': 'Peptide Raw Materials'
    },
    
    products: [],
    byId: {}
};

// ==========================================
// 1. Precise Image Mapping (Based on your GitHub files)
// ==========================================
const productData = [
    // --- 1. Surgical Sutures ---
    { name: "PGA Absorbable Suture", id: "pga-absorbable-suture", category: "surgical-sutures", img: "images/products/surgical-sutures/pga-absorbable-suture.jpg" },
    { name: "PGLA Absorbable Suture", id: "pgla-absorbable-suture", category: "surgical-sutures", img: "images/products/surgical-sutures/pgla-absorbable-suture.jpg" },
    { name: "Chromic Catgut", id: "chromic-catgut", category: "surgical-sutures", img: "images/products/surgical-sutures/chromic-catgut.jpg" },
    { name: "Plain Catgut", id: "plain-catgut", category: "surgical-sutures", img: "images/products/surgical-sutures/plain-catgut.jpg" },
    { name: "Silk Suture", id: "silk-suture", category: "surgical-sutures", img: "images/products/surgical-sutures/silk-suture.jpg" },
    { name: "Nylon Suture", id: "nylon-suture", category: "surgical-sutures", img: "images/products/surgical-sutures/nylon-suture.jpg" },
    { name: "Polypropylene Suture", id: "polypropylene-suture", category: "surgical-sutures", img: "images/products/surgical-sutures/polypropylene-suture.jpg" },
    { name: "Polyester Suture", id: "polyester-suture", category: "surgical-sutures", img: "images/products/surgical-sutures/polyester-suture.jpg" },
    { name: "PDO Suture", id: "pdo-suture", category: "surgical-sutures", img: "images/products/surgical-sutures/pdo-suture.jpg" },

    // --- 2. Surgical Instruments ---
    { name: "Surgical Blades", id: "surgical-blades", category: "surgical-instruments", img: "images/products/surgical-instruments/surgical-blades.jpg" },
    { name: "Scalpels", id: "scalpels", category: "surgical-instruments", img: "images/products/surgical-instruments/scalpels.jpg" },
    { name: "Lancets", id: "lancets", category: "surgical-instruments", img: "images/products/surgical-instruments/lancets.jpg" },
    { name: "Surgical Scissors", id: "surgical-scissors", category: "surgical-instruments", img: "images/products/surgical-instruments/surgical-scissors.jpg" },
    { name: "Forceps", id: "forceps", category: "surgical-instruments", img: "images/products/surgical-instruments/forceps.jpg" },
    { name: "Needle Holders", id: "needle-holders", category: "surgical-instruments", img: "images/products/surgical-instruments/needle-holders.jpg" },

    // --- 3. Gauze & Dressings ---
    { name: "Gauze Swabs", id: "gauze-swabs", category: "gauze-dressings", img: "images/products/gauze-dressings/gauze-swabs.jpg" },
    { name: "Gauze Rolls", id: "gauze-rolls", category: "gauze-dressings", img: "images/products/gauze-dressings/gauze-rolls.jpg" },
    { name: "Gauze Balls", id: "gauze-balls", category: "gauze-dressings", img: "images/products/gauze-dressings/gauze-balls.jpg" },
    { name: "Abdominal Pads", id: "abdominal-pads", category: "gauze-dressings", img: "images/products/gauze-dressings/abdominal-pads.jpg" },
    // Missing exact match images fallback to default or category general
    { name: "Cotton Rolls", id: "cotton-rolls", category: "gauze-dressings", img: "images/products/gauze-dressings/cotton-rolls.jpg" },
    { name: "Cotton Balls", id: "cotton-balls", category: "gauze-dressings", img: "images/products/gauze-dressings/cotton-balls.jpg" },
    { name: "Non-woven Sponges", id: "non-woven-sponges", category: "gauze-dressings", img: "images/products/gauze-dressings/non-woven-sponges.jpg" },

    // --- 4. Protective Equipment ---
    { name: "Surgical Face Masks", id: "surgical-face-masks", category: "protective-equipment", img: "images/products/protective-equipment/surgical-face-masks.jpg" },
    { name: "N95 / FFP2 Masks", id: "n95-ffp2-masks", category: "protective-equipment", img: "images/products/protective-equipment/n95-ffp2-masks.jpg" },
    { name: "Surgical Gowns", id: "surgical-gowns", category: "protective-equipment", img: "images/products/protective-equipment/surgical-gowns.jpg" },
    { name: "Protective Coveralls", id: "protective-coveralls", category: "protective-equipment", img: "images/products/protective-equipment/protective-coveralls.jpg" },
    { name: "Disposable Caps", id: "disposable-caps", category: "protective-equipment", img: "images/products/protective-equipment/disposable-caps.jpg" },
    { name: "Shoe Covers", id: "shoe-covers", category: "protective-equipment", img: "images/products/protective-equipment/shoe-covers.jpg" },

    // --- 5. Injection & Infusion ---
    { name: "Disposable Syringes", id: "disposable-syringes", category: "injection-infusion", img: "images/products/injection-infusion/disposable-syringes.jpg" },
    { name: "Insulin Syringes", id: "insulin-syringes", category: "injection-infusion", img: "images/products/injection-infusion/insulin-syringes.jpg" },
    { name: "Hypodermic Needles", id: "hypodermic-needles", category: "injection-infusion", img: "images/products/injection-infusion/hypodermic-needles.jpg" },
    { name: "IV Cannula", id: "iv-cannula", category: "injection-infusion", img: "images/products/injection-infusion/iv-cannula.jpg" },
    { name: "Infusion Sets", id: "infusion-sets", category: "injection-infusion", img: "images/products/injection-infusion/infusion-sets.jpg" },
    { name: "Blood Transfusion Sets", id: "blood-transfusion-sets", category: "injection-infusion", img: "images/products/injection-infusion/blood-transfusion-sets.jpg" },

    // --- 6. Dental Products ---
    { name: "Dental Examination Kits", id: "dental-examination-kits", category: "dental-products", img: "images/products/dental-products/dental-examination-kits.jpg" },
    { name: "Oral Care Kits", id: "oral-care-kits", category: "dental-products", img: "images/products/dental-products/oral-care-kits.jpg" },
    { name: "Saliva Ejectors", id: "saliva-ejectors", category: "dental-products", img: "images/products/dental-products/saliva-ejectors.jpg" },
    { name: "Dental Bibs", id: "dental-bibs", category: "dental-products", img: "images/products/dental-products/dental-bibs.jpg" },
    { name: "Impression Trays", id: "impression-trays", category: "dental-products", img: "images/products/dental-products/impression-trays.jpg" },

    // --- 7. Surgical Packs (Main Image as fallback for sub-items) ---
    // Note: You have one main image 'images/products/surgical-packs/surgical-packs.jpg'
    { name: "Surgical Packs (General)", id: "surgical-packs-general", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "Umbilical Cord Protection Kit", id: "umbilical-cord-protection-kit", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "Gynecological Examination Kit", id: "gynecological-examination-kit", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "HPV Screening Kit", id: "hpv-screening-kit", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "ENT Examination Kit", id: "ent-examination-kit", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "Disposable Suture Set", id: "disposable-suture-set", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "Wound Dressing Kit", id: "wound-dressing-kit", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "Debridement Kit", id: "debridement-kit", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "Perineal Care Kit", id: "perineal-care-kit", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "Disposable Shaving Kit", id: "disposable-shaving-kit", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "Sterile Dialysis Care Kit", id: "sterile-dialysis-care-kit", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },
    { name: "Uterine Suction Curettage Set", id: "uterine-suction-curettage-set", category: "surgical-packs", img: "images/products/surgical-packs/surgical-packs.jpg" },

    // --- 8. Pharmaceutical Packaging ---
    { name: "Pharmaceutical Folding Cartons", id: "pharma-folding-cartons", category: "pharmaceutical-packaging", img: "images/products/pharmaceutical-packaging/pharma-folding-cartons.jpg" },
    { name: "Package Inserts (IFU)", id: "pharma-package-inserts", category: "pharmaceutical-packaging", img: "images/products/pharmaceutical-packaging/pharma-package-inserts.jpg" },
    { name: "Self-Adhesive Pharmaceutical Labels", id: "pharma-adhesive-labels", category: "pharmaceutical-packaging", img: "images/products/pharmaceutical-packaging/pharma-adhesive-labels.jpg" },
    { name: "Holographic Anti-Counterfeit Labels", id: "pharma-hologram-labels", category: "pharmaceutical-packaging", img: "images/products/pharmaceutical-packaging/pharma-hologram-labels.jpg" },
    { name: "Pharmaceutical Blister Trays", id: "pharma-blister-trays", category: "pharmaceutical-packaging", img: "images/products/pharmaceutical-packaging/pharma-blister-trays.jpg" },
    { name: "5-Amino-1MQ API", id: "v5-pep-001", category: "peptide-raw-materials", img: "images/products/v5-pep-001-main.jpg" },
    { name: "SS-31 API", id: "v5-pep-002", category: "peptide-raw-materials", img: "images/products/v5-pep-002-main.jpg" },
    { name: "Acetic Acid Water 0.6% API", id: "v5-pep-003", category: "peptide-raw-materials", img: "images/products/v5-pep-003-main.jpg" },
    { name: "AOD9604 API", id: "v5-pep-004", category: "peptide-raw-materials", img: "images/products/v5-pep-004-main.jpg" },
    { name: "ARA-290 API", id: "v5-pep-005", category: "peptide-raw-materials", img: "images/products/v5-pep-005-main.jpg" },
    { name: "AHK-Cu API", id: "v5-pep-006", category: "peptide-raw-materials", img: "images/products/v5-pep-006-main.jpg" },
    { name: "Vitamin B12 API", id: "v5-pep-007", category: "peptide-raw-materials", img: "images/products/v5-pep-007-main.jpg" },
    { name: "BAC water          无菌水 WAC API", id: "v5-pep-008", category: "peptide-raw-materials", img: "images/products/v5-pep-008-main.jpg" },
    { name: "BPC157 API", id: "v5-pep-009", category: "peptide-raw-materials", img: "images/products/v5-pep-009-main.jpg" },
    { name: "CJC1295（Without DAC） API", id: "v5-pep-010", category: "peptide-raw-materials", img: "images/products/v5-pep-010-main.jpg" },
    { name: "CJC-1295 no DAC API", id: "v5-pep-011", category: "peptide-raw-materials", img: "images/products/v5-pep-011-main.jpg" },
    { name: "GHK-CU API", id: "v5-pep-012", category: "peptide-raw-materials", img: "images/products/v5-pep-012-main.jpg" },
    { name: "DSIP API", id: "v5-pep-013", category: "peptide-raw-materials", img: "images/products/v5-pep-013-main.jpg" },
    { name: "Epithalon API", id: "v5-pep-014", category: "peptide-raw-materials", img: "images/products/v5-pep-014-main.jpg" },
    { name: "Gonadorelin (GT/GTT) API", id: "v5-pep-015", category: "peptide-raw-materials", img: "images/products/v5-pep-015-main.jpg" },
    { name: "IGF-1 LR3 API", id: "v5-pep-016", category: "peptide-raw-materials", img: "images/products/v5-pep-016-main.jpg" },
    { name: "Ipamorelin API", id: "v5-pep-017", category: "peptide-raw-materials", img: "images/products/v5-pep-017-main.jpg" },
    { name: "BPC API", id: "v5-pep-018", category: "peptide-raw-materials", img: "images/products/v5-pep-018-main.jpg" },
    { name: "KPV API", id: "v5-pep-019", category: "peptide-raw-materials", img: "images/products/v5-pep-019-main.jpg" },
    { name: "Kisspeptin-10 API", id: "v5-pep-020", category: "peptide-raw-materials", img: "images/products/v5-pep-020-main.jpg" },
    { name: "LC Lipolytic API", id: "v5-pep-021", category: "peptide-raw-materials", img: "images/products/v5-pep-021-main.jpg" },
    { name: "MOTS-C API", id: "v5-pep-022", category: "peptide-raw-materials", img: "images/products/v5-pep-022-main.jpg" },
    { name: "Melanotan II API", id: "v5-pep-023", category: "peptide-raw-materials", img: "images/products/v5-pep-023-main.jpg" },
    { name: "NAD+ API", id: "v5-pep-024", category: "peptide-raw-materials", img: "images/products/v5-pep-024-main.jpg" },
    { name: "Snap-8 (Argireline) API", id: "v5-pep-025", category: "peptide-raw-materials", img: "images/products/v5-pep-025-main.jpg" },
    { name: "PT-141 API", id: "v5-pep-026", category: "peptide-raw-materials", img: "images/products/v5-pep-026-main.jpg" },
    { name: "Retatrutide API", id: "v5-pep-027", category: "peptide-raw-materials", img: "images/products/v5-pep-027-main.jpg" },
    { name: "selank API", id: "v5-pep-028", category: "peptide-raw-materials", img: "images/products/v5-pep-028-main.jpg" },
    { name: "Semaglutide API", id: "v5-pep-029", category: "peptide-raw-materials", img: "images/products/v5-pep-029-main.jpg" },
    { name: "Sermorelin API", id: "v5-pep-030", category: "peptide-raw-materials", img: "images/products/v5-pep-030-main.jpg" },
    { name: "Thymosin Alpha-1 API", id: "v5-pep-031", category: "peptide-raw-materials", img: "images/products/v5-pep-031-main.jpg" },
    { name: "TB500 CTHYMOSIN B4Acetate API", id: "v5-pep-032", category: "peptide-raw-materials", img: "images/products/v5-pep-032-main.jpg" },
    { name: "TB-500 API", id: "v5-pep-033", category: "peptide-raw-materials", img: "images/products/v5-pep-033-main.jpg" },
    { name: "Tirzepatide API", id: "v5-pep-034", category: "peptide-raw-materials", img: "images/products/v5-pep-034-main.jpg" },
    { name: "Tesamorelin API", id: "v5-pep-035", category: "peptide-raw-materials", img: "images/products/v5-pep-035-main.jpg" },
    { name: "Thymalin API", id: "v5-pep-036", category: "peptide-raw-materials", img: "images/products/v5-pep-036-main.jpg" },
    { name: "VIP (Vasoactive Intestinal Peptide) API", id: "v5-pep-037", category: "peptide-raw-materials", img: "images/products/v5-pep-037-main.jpg" },
    { name: "Lemon Bottle API", id: "v5-pep-038", category: "peptide-raw-materials", img: "images/products/v5-pep-038-main.jpg" },
    { name: "LC216 Lipolytic API", id: "v5-pep-039", category: "peptide-raw-materials", img: "images/products/v5-pep-039-main.jpg" },
    { name: "Disposable Syringe 3-Part 5ml", id: "v5-sur-001", category: "injection-infusion", img: "images/products/v5-sur-001-main.jpg" },
    { name: "Disposable Syringe 3-Part 10ml", id: "v5-sur-002", category: "injection-infusion", img: "images/products/v5-sur-002-main.jpg" },
    { name: "Pen Needle (GLP-1 Compatible)", id: "v5-sur-003", category: "injection-infusion", img: "images/products/v5-sur-003-main.jpg" },
    { name: "Disposable Biopsy Forceps", id: "v5-sur-004", category: "injection-infusion", img: "images/products/v5-sur-004-main.jpg" },
    { name: "Alcohol Prep Pad", id: "v5-sur-005", category: "injection-infusion", img: "images/products/v5-sur-005-main.jpg" },
    { name: "Vaccine Color Box", id: "v5-pkg-001", category: "pharmaceutical-packaging", img: "images/products/v5-pkg-001-main.jpg" },
    { name: "Package Insert / Leaflet", id: "v5-pkg-002", category: "pharmaceutical-packaging", img: "images/products/v5-pkg-002-main.jpg" },
    { name: "Vaccination Card + Plastic Sleeve", id: "v5-pkg-003", category: "pharmaceutical-packaging", img: "images/products/v5-pkg-003-main.jpg" },
    { name: "Vial Label (Self-Adhesive)", id: "v5-pkg-004", category: "pharmaceutical-packaging", img: "images/products/v5-pkg-004-main.jpg" },
    { name: "Pharmaceutical Packaging Kit", id: "v5-pkg-005", category: "pharmaceutical-packaging", img: "images/products/v5-pkg-005-main.jpg" },
    { name: "Dental Suture", id: "v5-den-001", category: "dental-products", img: "images/products/v5-den-001-main.jpg" },
    { name: "Debonding Agent", id: "v5-den-002", category: "dental-products", img: "images/products/v5-den-002-main.jpg" },
];

// ==========================================
// 2. Category Profiles (certs / specs / copy per category)
// ==========================================
// 认证与规格按分类给出，避免"一刀切"宣称（如包装类产品标注 Sterile/FDA）。
const categoryProfiles = {
    'surgical-sutures': {
        certifications: ["ISO 13485", "CE"],
        desc: name => `${name} for general and specialty surgery, produced under ISO 13485 with CE technical documentation. Consistent tensile strength and reliable needle attachment. OEM needle-thread combinations and private labeling available for global distributors.`,
        specifications: {
            "Material": "PGA / PGLA / PDO / Catgut / Silk / Nylon / PP / PE",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Individual sterile pack, boxed",
            "Origin": "China"
        }
    },
    'surgical-instruments': {
        certifications: ["ISO 13485", "CE"],
        desc: name => `${name} for single-use clinical procedures, manufactured under ISO 13485 with full batch traceability. Sharpness and finish controlled to surgical standards. Bulk supply and OEM packaging for hospitals and distributors.`,
        specifications: {
            "Material": "Medical-grade stainless steel / polymer",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Individual sterile peel pack",
            "Origin": "China"
        }
    },
    'gauze-dressings': {
        certifications: ["ISO 13485", "CE"],
        desc: name => `${name} made from high-absorbency medical-grade materials, available sterile or non-sterile with EO sterilization and batch traceability. OEM branding and custom sizes supported.`,
        specifications: {
            "Material": "100% medical-grade cotton / non-woven",
            "Sterility": "Sterile or non-sterile options",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Sterile pouch or bulk pack",
            "Origin": "China"
        }
    },
    'protective-equipment': {
        certifications: ["ISO 13485", "CE"],
        desc: name => `${name} for hospital and clinical protection, CE-compliant with test reports and export documentation. Suitable for tenders and high-volume procurement.`,
        specifications: {
            "Material": "Non-woven PP / SMS",
            "Sterility": "Non-sterile (sterile on request)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Bulk pack, OEM printing available",
            "Origin": "China"
        }
    },
    'surgical-packs': {
        certifications: ["ISO 13485", "CE"],
        desc: name => `${name} custom-configured to your procedure list, assembled with AAMI-level barrier materials and EO sterilization. Full validation documentation and private labeling available.`,
        specifications: {
            "Material": "AAMI-level SMS barrier materials",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Custom-configured sterile pack",
            "Origin": "China"
        }
    },
    'injection-infusion': {
        certifications: ["ISO 13485", "CE"],
        desc: name => `${name} manufactured under ISO 13485 with CE certification, EO-sterilized and individually packed. OEM and tender support for global distributors.`,
        specifications: {
            "Material": "Medical-grade PP / PVC / stainless needle",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Individual sterile blister / peel pack",
            "Origin": "China"
        }
    },
    'dental-products': {
        certifications: ["ISO 13485", "CE"],
        desc: name => `${name} for dental clinics and distributors — cost-effective, sterile-packed consumables with private-label packaging options.`,
        specifications: {
            "Material": "Medical-grade polymer / paper",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Individual sterile pack, boxed",
            "Origin": "China"
        }
    },
    'pharmaceutical-packaging': {
        certifications: ["ISO 13485", "OEM Available"],
        desc: name => `${name} as part of a complete pharmaceutical secondary packaging set — one supplier, one quality standard, one consolidated shipment. Custom printing, tamper-evident and serialization options available.`,
        specifications: {
            "Material": "Pharmaceutical-grade paperboard / PVC / PP",
            "Sterility": "Non-sterile (secondary packaging)",
            "Quality Standard": "ISO 13485 QMS",
            "Packaging": "Export cartons, custom printing",
            "Origin": "China"
        }
    }
};

// ==========================================
// 3. Data Builder
// ==========================================

const completeProductData = productData.map(item => {
    const profile = categoryProfiles[item.category];
    return {
        id: item.id,
        name: item.name,
        category: item.category,
        short: `High-quality ${item.name} for professional medical use. ISO 13485 certified.`,
        description: `V5 Medical supplies ${item.name}. ${profile.desc(item.name)}`,
        price: "Contact for Price",
        availability: "In Stock",
        stockLevel: "High",
        certifications: profile.certifications,
        images: [
            item.img, // Primary mapped image
            "images/products/default-product.jpg" // Fallback
        ],
        specifications: profile.specifications
    };
});

// ==========================================
// 4. Initialization
// ==========================================

function initializeCompleteDatabase() {
    completeProductDatabase.products = [...completeProductData];
    completeProductDatabase.byId = {};
    
    completeProductData.forEach(product => {
        completeProductDatabase.byId[product.id] = product;
    });
    
    completeProductDatabase.metadata.totalProducts = completeProductData.length;
    console.log(`[CompleteProducts.js] v${completeProductDatabase.metadata.version} initialized with ${completeProductData.length} products`);
    
    return completeProductDatabase;
}

if (typeof window !== 'undefined') {
    initializeCompleteDatabase();
    window.completeProductDatabase = completeProductDatabase;
    window.completeProductData = completeProductData;
}

if (typeof module !== 'undefined') {
    module.exports = { completeProductDatabase, completeProductData };
}
