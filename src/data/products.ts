export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  manufactureDate: string;
  category: string;
  materials: { name: string; percentage: number; recyclable: boolean }[];
  repairabilityScore: number; // 1-10
  carbonFootprint: string;
  description: string;
  imageUrl: string;
  maintenanceGuide: string;
  technicalSpecs?: string[];
  recommendation?: {
    score: number; // 1-10
    text: string;
  };
}

export const products: Product[] = [
  {
    id: "SN-GT-24-8921",
    name: "EcoPhone X1",
    manufacturer: "GreenTech Mobile",
    manufactureDate: "2024-01-15",
    category: "Electrònica",
    materials: [
      { name: "Alumini Reciclat", percentage: 40, recyclable: true },
      { name: "Vidre Gorilla", percentage: 30, recyclable: true },
      { name: "Plàstic Bio-basat", percentage: 20, recyclable: true },
      { name: "Components Electrònics", percentage: 10, recyclable: false },
    ],
    repairabilityScore: 9.2,
    carbonFootprint: "45kg CO2e",
    description: "Un telèfon intel·ligent modular dissenyat per durar. Fàcil de reparar i actualitzar.",
    imageUrl: "https://picsum.photos/seed/phone/400/400",
    maintenanceGuide: "Netegeu la pantalla amb un drap de microfibra. Eviteu l'exposició a temperatures extremes. La bateria és reemplaçable per l'usuari.",
    technicalSpecs: [
      "Processador: EcoChip G1 (5nm)",
      "RAM: 8GB LPDDR5",
      "Emmagatzematge: 256GB",
      "Pantalla: 6.5\" OLED 90Hz",
      "Bateria: 4500mAh (Reemplaçable)"
    ],
    recommendation: {
      score: 9.5,
      text: "Molt recomanable per la seva alta reparabilitat i compromís amb el medi ambient. Ideal per a usuaris conscients."
    }
  },
  {
    id: "SN-FL-23-4452",
    name: "Cadira Ergonomica Re-Seat",
    manufacturer: "Furniture Loop",
    manufactureDate: "2023-11-20",
    category: "Mobiliari",
    materials: [
      { name: "Fusta FSC", percentage: 60, recyclable: true },
      { name: "Teixit de PET Reciclat", percentage: 30, recyclable: true },
      { name: "Acer", percentage: 10, recyclable: true },
    ],
    repairabilityScore: 10,
    carbonFootprint: "12kg CO2e",
    description: "Cadira d'oficina feta amb materials 100% reciclats i dissenyada per ser desmuntada fàcilment.",
    imageUrl: "https://picsum.photos/seed/chair/400/400",
    maintenanceGuide: "Aspirar el teixit setmanalment. Ajustar els cargols cada 6 mesos. La fusta es pot tractar amb oli natural.",
    technicalSpecs: [
      "Pes màxim: 120kg",
      "Altura ajustable: 45-55cm",
      "Material base: Acer reciclat",
      "Garantia: 10 anys"
    ],
    recommendation: {
      score: 9.8,
      text: "Excel·lent opció per a oficines sostenibles. Durabilitat extrema i disseny atemporal."
    }
  },
  {
    id: "SN-EW-24-0091",
    name: "Jaqueta Tèrmica Zero-Waste",
    manufacturer: "EcoWear",
    manufactureDate: "2024-02-10",
    category: "Roba",
    materials: [
      { name: "Polièster Reciclat", percentage: 80, recyclable: true },
      { name: "Cotó Orgànic", percentage: 20, recyclable: true },
    ],
    repairabilityScore: 8.5,
    carbonFootprint: "8kg CO2e",
    description: "Jaqueta impermeable i transpirable, feta sense residus de tall.",
    imageUrl: "https://picsum.photos/seed/jacket/400/400",
    maintenanceGuide: "Rentar a màquina en fred (30°C). No utilitzar assecadora. Es poden posar pegats fàcilment si es trenca.",
    technicalSpecs: [
      "Impermeabilitat: 10.000mm",
      "Transpirabilitat: 8.000g/m2/24h",
      "Aïllament: Sintètic reciclat",
      "Pes: 450g"
    ],
    recommendation: {
      score: 8.9,
      text: "Bona compra per a climes freds i plujosos. El disseny zero-waste és un gran plus."
    }
  },
];
