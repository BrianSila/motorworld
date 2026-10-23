import type { Car } from "./api/types";
import { listCars, type CarFilters } from "./api/cars";
import { toWhatsAppUrl } from "./format";

export type ActionLink = {
  label: string;
  url: string;
  external?: boolean;
};

export type BotResponse = {
  text: string;
  cars?: Car[];
  suggestions?: string[];
  actionLink?: ActionLink;
};

const HOTLINE_PHONE = "0740892332";

const POPULAR_MAKES = [
  "Toyota",
  "Subaru",
  "Mazda",
  "Nissan",
  "Honda",
  "Mercedes-Benz",
  "Mercedes",
  "BMW",
  "Volkswagen",
  "Mitsubishi",
  "Isuzu",
  "Land Rover",
  "Audi",
  "Ford",
  "Hyundai",
  "Suzuki",
  "Lexus",
  "Peugeot",
  "Volvo",
  "Porsche",
  "Jeep",
];

const POPULAR_MODELS = [
  "Prado",
  "Land Cruiser",
  "Harrier",
  "Premio",
  "Allion",
  "Axio",
  "Fielder",
  "RAV4",
  "Hilux",
  "Fortuner",
  "Wish",
  "Passo",
  "Vitz",
  "Yaris",
  "Corolla",
  "Camry",
  "Crown",
  "Noah",
  "Voxy",
  "Alphard",
  "Vellfire",
  "Probox",
  "Succeed",
  "Forester",
  "Outback",
  "Impreza",
  "XV",
  "Legacy",
  "Levorg",
  "CX-5",
  "CX5",
  "Demio",
  "CX-3",
  "CX3",
  "CX-8",
  "CX-30",
  "Axela",
  "Atenza",
  "Mazda 3",
  "Mazda 6",
  "X-Trail",
  "XTrail",
  "Note",
  "Juke",
  "Serena",
  "Teana",
  "Sylphy",
  "Dualis",
  "Qashqai",
  "Patrol",
  "Navara",
  "CR-V",
  "CRV",
  "Vezel",
  "Fit",
  "Civic",
  "Accord",
  "Cayenne",
  "Macan",
  "C200",
  "C180",
  "C250",
  "E200",
  "E250",
  "E300",
  "GLC",
  "GLE",
  "X5",
  "X3",
  "X1",
  "320i",
  "520i",
  "Golf",
  "Tiguan",
  "Touareg",
  "Passat",
  "Polo",
  "Pajero",
  "Outlander",
  "RVR",
  "L200",
  "D-Max",
  "DMax",
  "Mu-X",
  "Range Rover",
  "Discovery",
  "Defender",
  "Evoque",
];

const SUV_PATTERNS = [
  "prado",
  "land cruiser",
  "cayenne",
  "macan",
  "cx-5",
  "cx5",
  "cx-3",
  "cx3",
  "cx-8",
  "cx-30",
  "forester",
  "outback",
  "xv",
  "harrier",
  "rav4",
  "fortuner",
  "x-trail",
  "xtrail",
  "cr-v",
  "crv",
  "vezel",
  "pajero",
  "outlander",
  "rvr",
  "touareg",
  "tiguan",
  "x5",
  "x3",
  "x1",
  "glc",
  "gle",
  "range rover",
  "discovery",
  "defender",
  "evoque",
];

export const INITIAL_SUGGESTIONS = [
  "🚗 Browse Available Cars",
  "💰 Cars Under 2M KES",
  "🚙 Show SUVs & 4x4s",
  "⚡ Hybrid & Fuel Savers",
  "📅 Book a Test Drive",
  "🏷️ How to Sell My Car",
  "📋 NTSA Logbook Transfer",
  "📞 Talk to an Agent",
];

function extractPrice(message: string): { min?: number; max?: number } {
  const lower = message.toLowerCase();

  // Pattern: "under 2m", "below 1.5m", "less than 3 million", "< 2.5m"
  const underMatch = lower.match(
    /(?:under|below|less than|max|up to|budget|within|<)\s*(?:kes|ksh)?\s*([0-9]+(?:\.[0-9]+)?)\s*(m|million|k)?/i,
  );
  if (underMatch) {
    const val = parseFloat(underMatch[1]);
    const unit = underMatch[2]?.toLowerCase();
    let max = val;
    if (unit === "m" || unit === "million" || val < 100) {
      max = val * 1_000_000;
    } else if (unit === "k") {
      max = val * 1_000;
    }
    return { max };
  }

  // Pattern: "between 1m and 2m", "1.5m to 3m"
  const rangeMatch = lower.match(
    /([0-9]+(?:\.[0-9]+)?)\s*(m|million)?\s*(?:to|-|and)\s*([0-9]+(?:\.[0-9]+)?)\s*(m|million)/i,
  );
  if (rangeMatch) {
    const minVal = parseFloat(rangeMatch[1]);
    const maxVal = parseFloat(rangeMatch[3]);
    return {
      min: minVal < 100 ? minVal * 1_000_000 : minVal,
      max: maxVal < 100 ? maxVal * 1_000_000 : maxVal,
    };
  }

  // Exact number like 1500000 or 2,000,000
  const rawNumMatch = lower.match(/(?:under|below)\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{6,8})/i);
  if (rawNumMatch) {
    const num = parseFloat(rawNumMatch[1].replace(/,/g, ""));
    if (!isNaN(num)) return { max: num };
  }

  return {};
}

function extractMake(message: string): string | undefined {
  const lower = message.toLowerCase();
  for (const make of POPULAR_MAKES) {
    const makeLower = make.toLowerCase();
    const regex = new RegExp(`\\b${makeLower}\\b`, "i");
    if (regex.test(lower)) {
      return make === "Mercedes" ? "Mercedes-Benz" : make;
    }
  }
  return undefined;
}

function extractModel(message: string): string | undefined {
  const lower = message.toLowerCase();
  for (const model of POPULAR_MODELS) {
    const regex = new RegExp(`\\b${model.toLowerCase()}\\b`, "i");
    if (regex.test(lower)) {
      return model;
    }
  }
  return undefined;
}

function extractFuelType(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (lower.includes("hybrid")) return "Hybrid";
  if (lower.includes("diesel")) return "Diesel";
  if (lower.includes("petrol") || lower.includes("gasoline")) return "Petrol";
  if (lower.includes("electric") || lower.includes("ev")) return "Electric";
  return undefined;
}

function extractTransmission(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (lower.includes("manual")) return "Manual";
  if (lower.includes("automatic") || lower.includes("auto")) return "Automatic";
  if (lower.includes("cvt")) return "CVT";
  return undefined;
}

export async function processUserMessage(
  rawInput: string,
  context?: { currentCar?: Car | null; pathname?: string },
): Promise<BotResponse> {
  const input = rawInput.trim();
  const lower = input.toLowerCase();

  // 1. Greetings
  if (
    /^(hi|hello|hey|jambo|habari|good morning|good afternoon|good evening|mambo|sasa)\b/i.test(
      lower,
    )
  ) {
    return {
      text: "Hello! Welcome to Simatei Motorworld — Kenya's trusted vehicle marketplace 🚗\n\nI can help you search our live inventory, book a test drive, understand how to sell your vehicle, guide you through NTSA logbook transfers, or connect you with our team.\n\nWhat are you looking for today?",
      suggestions: [
        "🚗 Browse Available Cars",
        "💰 Cars Under 2M KES",
        "🚙 Show SUVs & 4x4s",
        "📅 Book a Test Drive",
        "🏷️ How to Sell My Car",
        "📞 Talk to an Agent",
      ],
    };
  }

  // 2. Contact / Call / WhatsApp / Human Agent
  if (
    lower.includes("contact") ||
    lower.includes("talk to human") ||
    lower.includes("talk to an agent") ||
    lower.includes("customer care") ||
    lower.includes("phone number") ||
    lower.includes("call you") ||
    lower.includes("whatsapp") ||
    lower.includes("agent") ||
    lower.includes("support")
  ) {
    const waUrl = toWhatsAppUrl(
      HOTLINE_PHONE,
      "Hi Simatei Admin, I was chatting with your website assistant and would like to speak directly with an agent.",
    );
    return {
      text: "You can reach our sales and support team directly anytime:\n\n📞 **Admin Hotline:** [+254 740 892 332](tel:+254740892332)\n💬 **WhatsApp:** Click the button below to start a live WhatsApp chat with our team\n📍 **Location:** Nairobi, Kenya\n⏰ **Hours:** Mon - Sat, 8:00 AM - 6:00 PM\n\nHow else can I assist you right now?",
      actionLink: {
        label: "Chat on WhatsApp (+254 740 892 332)",
        url: waUrl,
        external: true,
      },
      suggestions: ["🚗 Browse Available Cars", "📅 Book a Test Drive", "🏷️ How to Sell My Car"],
    };
  }

  // 3. Test Drive Assistance
  if (
    lower.includes("test drive") ||
    lower.includes("book a test") ||
    lower.includes("schedule a test") ||
    lower.includes("drive the car") ||
    lower.includes("test-drive")
  ) {
    if (context?.currentCar) {
      return {
        text: `You're currently viewing the **${context.currentCar.year} ${context.currentCar.make} ${context.currentCar.model}**! 🎉\n\nTo schedule a test drive:\n1. Click the **"Book a test drive"** button right on this car's page\n2. Select your preferred date and time slot (08:00 AM – 06:00 PM)\n3. Bring a valid Kenyan Driver's License or International Driving Permit on the day of your drive\n\nWould you like more details on this car or need assistance booking?`,
        suggestions: [
          `💰 Is the price negotiable?`,
          "📋 What documents are needed?",
          "💬 WhatsApp Seller",
        ],
      };
    }

    return {
      text: "Scheduling a test drive at Simatei Motorworld is fast and easy:\n\n1. Browse our inventory and pick the car you'd like to experience\n2. On the car details page, click **'Book a test drive'**\n3. Select your preferred date and time slot (available Mon - Sat, 8:00 AM to 6:00 PM)\n4. Bring a valid Driver's License or International Permit\n\nOur vehicle specialist will prepare the vehicle and accompany you for a comprehensive road experience.",
      actionLink: {
        label: "Browse Vehicles for Test Drive",
        url: "/cars",
      },
      suggestions: ["🚗 Browse Available Cars", "🚙 Show SUVs & 4x4s", "📞 Call to Book Drive"],
    };
  }

  // 4. Sell a Vehicle
  if (
    lower.includes("sell") ||
    lower.includes("how to sell") ||
    lower.includes("list my car") ||
    lower.includes("sell my car") ||
    lower.includes("post an ad") ||
    lower.includes("trade-in") ||
    lower.includes("trade in")
  ) {
    return {
      text: "Selling your vehicle on Simatei Motorworld is straightforward and gets maximum reach across Kenya:\n\n1. **Create an account** or Sign In (it takes less than 30 seconds)\n2. Go to **'Sell'** in the navigation or click the button below\n3. Fill in your vehicle details (Make, Model, Year, Mileage, Fuel type, Transmission, Price)\n4. Upload crisp photos (front, side, rear, interior, and dashboard)\n5. Publish! Verified buyers across Kenya can view your listing and send you enquiries directly.",
      actionLink: {
        label: "List Your Vehicle for Sale",
        url: "/sell",
      },
      suggestions: [
        "🚗 View Current Inventory",
        "📋 NTSA Logbook Transfer",
        "📞 Talk to Seller Support",
      ],
    };
  }

  // 5. NTSA TIMS & Logbook Transfer (Kenya Specific)
  if (
    lower.includes("logbook") ||
    lower.includes("tims") ||
    lower.includes("ntsa") ||
    lower.includes("transfer") ||
    lower.includes("ownership") ||
    lower.includes("kra")
  ) {
    return {
      text: "Here is the official **Logbook Transfer Process** in Kenya via NTSA TIMS / eCitizen:\n\n1. **Online Transfer Initiation:** The seller initiates the transfer on the NTSA TIMS portal by entering the buyer's National ID and KRA PIN.\n2. **Buyer Acceptance:** The buyer logs into their TIMS account to review vehicle details and accept the transfer.\n3. **Payment:** Transfer fees and purchase tax are paid directly on TIMS (via M-Pesa or card).\n4. **Tape Lift / Inspection:** Motor vehicle inspection is conducted at an NTSA center.\n5. **Required Documents:**\n   • Original Logbook\n   • Seller & Buyer National ID copies\n   • KRA PIN certificates of both parties\n   • Tape lift / inspection clearance\n\nNeed help navigating the transfer? Our admin team is ready to guide you!",
      actionLink: {
        label: "WhatsApp Admin for Logbook Guidance",
        url: toWhatsAppUrl(
          HOTLINE_PHONE,
          "Hi Simatei Admin, I need guidance with logbook transfer and NTSA TIMS process.",
        ),
        external: true,
      },
      suggestions: [
        "🚗 Browse Available Cars",
        "🛡️ Are vehicles inspected?",
        "📞 Call Admin (+254 740 892 332)",
      ],
    };
  }

  // 6. Car Financing / Loans / Installments
  if (
    lower.includes("finance") ||
    lower.includes("financing") ||
    lower.includes("loan") ||
    lower.includes("installments") ||
    lower.includes("hire purchase") ||
    lower.includes("bank") ||
    lower.includes("deposit")
  ) {
    return {
      text: "Yes, we facilitate **Asset Financing & Car Loans** through partner commercial banks and microfinance institutions in Kenya:\n\n• **Financing Coverage:** Up to 70% – 80% financing on qualifying vehicles\n• **Repayment Period:** Flexible terms from 12 to 48 months\n• **Typical Requirements:**\n   1. 3 to 6 months certified bank statements\n   2. Latest 3 months payslips (if employed) or business records (if self-employed)\n   3. Copy of National ID and KRA PIN\n   4. Down payment / deposit (typically 20% to 30%)\n\nWould you like a financing quote on a specific vehicle?",
      actionLink: {
        label: "Contact Finance Desk on WhatsApp",
        url: toWhatsAppUrl(
          HOTLINE_PHONE,
          "Hi Simatei Team, I would like to inquire about asset financing / car loan options for vehicles on your marketplace.",
        ),
        external: true,
      },
      suggestions: ["🚗 Browse Available Cars", "💰 Cars Under 2M KES", "📅 Book a Test Drive"],
    };
  }

  // 7. Mechanical Inspection & Verification
  if (
    lower.includes("inspect") ||
    lower.includes("mechanic") ||
    lower.includes("condition") ||
    lower.includes("accident") ||
    lower.includes("mileage verification")
  ) {
    return {
      text: "At Simatei Motorworld, transparency and buyer confidence are our top priority:\n\n• **Pre-Purchase Inspection:** You are welcome and encouraged to bring your independent mechanic for a full physical and computerized diagnostic assessment.\n• **Chassis & Engine Verification:** We verify all chassis and engine numbers against original logbooks and NTSA records.\n• **Detailed Condition Badges:** Listings are clearly designated as New, Used, or Certified Pre-Owned with full mileage disclosure.\n• **Physical Viewing:** You can view vehicles at our partner hubs in Nairobi before making any payment.",
      suggestions: ["🚗 Browse Available Cars", "📅 Book a Test Drive", "📞 Contact Admin Hotline"],
    };
  }

  // 8. Location, Showroom & Operating Hours
  if (
    lower.includes("location") ||
    lower.includes("where are you") ||
    lower.includes("address") ||
    lower.includes("office") ||
    lower.includes("showroom") ||
    lower.includes("hours") ||
    lower.includes("opening time") ||
    lower.includes("closing time")
  ) {
    return {
      text: "📍 **Simatei Motorworld Headquarters & Hub:**\n• **City:** Nairobi, Kenya (serving buyers and sellers nationwide)\n• **Hotline:** [+254 740 892 332](tel:+254740892332)\n• **Working Hours:**\n   - Monday – Saturday: 8:00 AM – 6:00 PM\n   - Sunday & Public Holidays: By appointment\n\nVehicles are available for physical inspection and accompanied test drives in Nairobi.",
      actionLink: {
        label: "Call Us (+254 740 892 332)",
        url: "tel:+254740892332",
      },
      suggestions: ["🚗 Browse Inventory", "📅 Book a Test Drive", "💬 WhatsApp Us"],
    };
  }

  // 9. Negotiation / Price questions
  if (
    lower.includes("negotiable") ||
    lower.includes("discount") ||
    lower.includes("offer") ||
    lower.includes("bargain")
  ) {
    return {
      text: "Many vehicles on Simatei Motorworld are listed as **Negotiable**! Look for the green 'Negotiable' badge on each car card.\n\nTo make an offer:\n1. Click **'Call Seller'** or **'WhatsApp Seller'** directly on the car listing\n2. Mention the vehicle ID and your price proposal\n3. You can also contact Simatei Admin at [+254 740 892 332](tel:+254740892332) to negotiate or arrange escrow assistance.",
      suggestions: ["🚗 Browse Available Cars", "💰 Cars Under 2M KES", "📞 Talk to Simatei Admin"],
    };
  }

  // 10. Comparison / Advice Queries
  if (
    lower.includes("vs") ||
    lower.includes("compare") ||
    lower.includes("which is better") ||
    lower.includes("advice")
  ) {
    if (lower.includes("prado") || lower.includes("harrier")) {
      return {
        text: "💡 **Toyota Prado vs Toyota Harrier:**\n\n• **Toyota Prado (TX/TXL):**\n  - Built for rugged terrain, off-road, high ground clearance, full-time 4WD.\n  - Great 7-seater family vehicle with bulletproof resale value in Kenya.\n  - Best for upcountry trips, rough roads, and maximum presence.\n\n• **Toyota Harrier:**\n  - Built on a passenger car platform — plush luxury, smoother highway ride, superior fuel efficiency (especially Hybrid models).\n  - Best for Nairobi city driving, daily commutes, executive travel.\n\nWhich style fits your daily driving needs best?",
        suggestions: ["🚙 Show SUVs & 4x4s", "⚡ Hybrid Cars", "💰 Cars Under 3M KES"],
      };
    }

    if (lower.includes("cx-5") || lower.includes("forester") || lower.includes("cx5")) {
      return {
        text: "💡 **Mazda CX-5 vs Subaru Forester:**\n\n• **Mazda CX-5:**\n  - Head-turning Kodo design, premium leather interior feel, quiet cabin.\n  - SkyActiv petrol engines (2.0L/2.5L) offer great reliability and good fuel economy.\n\n• **Subaru Forester (SJ/SK):**\n  - Symmetrical All-Wheel Drive (AWD) excels in wet Kenyan roads and muddy terrain.\n  - Generous boot space and commanding ground clearance.\n\nBoth are immensely popular in Kenya with readily available spare parts in Nairobi!",
        suggestions: ["🚗 Show Mazda Cars", "🚗 Show Subaru Cars", "📅 Book a Test Drive"],
      };
    }
  }

  // 11. Fuel efficiency / hybrid questions
  if (
    lower.includes("fuel efficient") ||
    lower.includes("fuel consumption") ||
    lower.includes("mileage") ||
    lower.includes("cheap to run") ||
    lower.includes("fuel saver")
  ) {
    try {
      const response = await listCars({ fuel_type: "Hybrid", limit: 4, is_available: "true" });
      if (response && response.cars && response.cars.length > 0) {
        return {
          text: "Here are top fuel-efficient vehicles currently available in our inventory! Hybrid and compact models can deliver impressive economy (up to 20–25 km/L in city driving):",
          cars: response.cars,
          actionLink: {
            label: "View All Hybrid Vehicles",
            url: "/cars?fuel_type=Hybrid",
          },
          suggestions: ["💰 Cars Under 2M KES", "🚗 Browse Available Cars", "📅 Book a Test Drive"],
        };
      }
    } catch {
      // Fallback
    }

    return {
      text: "Top fuel-efficient choices popular in Kenya include:\n• **Hybrids:** Toyota Fielder Hybrid, Axio Hybrid, Harrier Hybrid, Honda Vezel Hybrid (20–28 km/L)\n• **City Hatchbacks:** Mazda Demio, Nissan Note (e-Power), Toyota Vitz (18–24 km/L)\n• **Economical Sedans:** Toyota Premio 1.5L, Toyota Allion 1.5L (15–18 km/L)\n\nWould you like me to show you the available vehicles in our inventory?",
      suggestions: ["🚗 Browse Available Cars", "💰 Cars Under 2M KES", "⚡ Show Hybrid Cars"],
    };
  }

  // 12. Live Inventory Search
  const isSUV =
    lower.includes("suv") ||
    lower.includes("4x4") ||
    lower.includes("crossover") ||
    lower.includes("prado") ||
    lower.includes("forester") ||
    lower.includes("cx-5") ||
    lower.includes("cx5") ||
    lower.includes("cayenne");

  const priceRange = extractPrice(input);
  const detectedMake = extractMake(input);
  const detectedModel = extractModel(input);
  const detectedFuel = extractFuelType(input);
  const detectedTransmission = extractTransmission(input);

  const isBrowseAll =
    lower.includes("browse available") ||
    lower.includes("browse all") ||
    lower.includes("show all cars") ||
    lower.includes("all cars") ||
    lower.includes("all vehicles") ||
    lower === "cars" ||
    lower === "inventory";

  // Check if this is an inventory search
  const isInventoryIntent =
    isBrowseAll ||
    isSUV ||
    Boolean(detectedMake) ||
    Boolean(detectedModel) ||
    Boolean(detectedFuel) ||
    Boolean(priceRange.max) ||
    lower.includes("car") ||
    lower.includes("cars") ||
    lower.includes("vehicle") ||
    lower.includes("inventory") ||
    lower.includes("browse") ||
    lower.includes("find") ||
    lower.includes("show me") ||
    lower.includes("looking for") ||
    lower.includes("cheap") ||
    lower.includes("budget");

  if (isInventoryIntent) {
    const filters: CarFilters = {
      limit: 4,
      is_available: "true",
    };

    if (detectedMake) filters.make = detectedMake;
    if (detectedModel) filters.model = detectedModel;
    if (detectedFuel) filters.fuel_type = detectedFuel;
    if (detectedTransmission) filters.transmission = detectedTransmission;
    if (priceRange.max) filters.price_max = priceRange.max;
    if (priceRange.min) filters.price_min = priceRange.min;

    try {
      // 1. If it's an SUV request, fetch available vehicles and match against SUV models
      if (isSUV && !detectedMake && !detectedModel) {
        const allAvailable = await listCars({ is_available: "true", limit: 20 });
        if (allAvailable && allAvailable.cars && allAvailable.cars.length > 0) {
          const matchingSuvs = allAvailable.cars.filter((c) => {
            const m = c.model.toLowerCase();
            const mk = c.make.toLowerCase();
            const desc = (c.description || "").toLowerCase();
            return (
              SUV_PATTERNS.some((pattern) => m.includes(pattern) || mk.includes(pattern)) ||
              desc.includes("suv") ||
              desc.includes("4x4")
            );
          });

          if (matchingSuvs.length > 0) {
            return {
              text: `Here are **${matchingSuvs.length} SUVs & 4x4s** available in our showroom right now:`,
              cars: matchingSuvs.slice(0, 4),
              actionLink: {
                label: "Browse All SUVs in Inventory →",
                url: "/cars",
              },
              suggestions: [
                "📅 Book a Test Drive",
                "💰 Are prices negotiable?",
                "💬 WhatsApp Sales Desk",
              ],
            };
          }
        }
      }

      // 2. Standard query with filters
      const response = await listCars(filters);
      if (response && response.cars && response.cars.length > 0) {
        let descriptor = "vehicles";
        if (isBrowseAll) descriptor = "available vehicles";
        else if (detectedMake && detectedModel)
          descriptor = `${detectedMake} ${detectedModel} vehicles`;
        else if (detectedMake) descriptor = `${detectedMake} vehicles`;
        else if (detectedModel) descriptor = `${detectedModel} vehicles`;
        else if (priceRange.max) {
          const maxFormatted =
            priceRange.max >= 1_000_000
              ? `${(priceRange.max / 1_000_000).toFixed(1)}M`
              : `${priceRange.max.toLocaleString()} KES`;
          descriptor = `vehicles under KES ${maxFormatted}`;
        }

        const countText = response.total === 1 ? "1 vehicle" : `${response.total} vehicles`;
        return {
          text: `I found **${countText}** matching ${descriptor} in our current inventory! Here are top recommendations:`,
          cars: response.cars,
          actionLink: {
            label: `View All ${response.total} Results in Inventory →`,
            url: `/cars?${new URLSearchParams(
              Object.entries(filters)
                .filter(([_, v]) => v !== undefined && v !== null && v !== "")
                .map(([k, v]) => [k, String(v)]),
            ).toString()}`,
          },
          suggestions: [
            "📅 Book a Test Drive",
            "💰 Are prices negotiable?",
            "💬 WhatsApp Sales Team",
          ],
        };
      }
    } catch (err) {
      console.warn("Chatbot inventory query error:", err);
    }

    // Fallback if 0 results matched specific filters: show latest available cars
    try {
      const fallbackResponse = await listCars({ limit: 3, is_available: "true" });
      if (fallbackResponse && fallbackResponse.cars && fallbackResponse.cars.length > 0) {
        const queryTerm = detectedMake || detectedModel || input;
        return {
          text: `We don't currently have an exact match for **"${queryTerm}"** in our immediate stock, but we receive fresh arrivals every week and can source custom units directly from Japan/UK or local verified sellers!\n\nHere are some of our latest available vehicles you might like:`,
          cars: fallbackResponse.cars,
          actionLink: {
            label: "Request Custom Unit on WhatsApp",
            url: toWhatsAppUrl(
              HOTLINE_PHONE,
              `Hi Simatei Admin, I was looking for ${input} on your website. Do you have one coming in or can you source it for me?`,
            ),
            external: true,
          },
          suggestions: [
            "🚗 Browse Available Cars",
            "🚙 Show SUVs & 4x4s",
            "📞 Call Hotline (+254 740 892 332)",
          ],
        };
      }
    } catch {
      // Fall through to general response
    }
  }

  // 13. Default friendly fallback with helpful suggestions and hotline
  return {
    text: `I'd love to help you with that! At Simatei Motorworld, you can:\n\n• **Search & compare vehicles** across Kenya with verified prices in KES\n• **Book accompanied test drives** directly online\n• **Sell your vehicle** to thousands of buyers across the country\n• **Get assistance** with NTSA TIMS logbook transfer and asset financing\n\nChoose an option below or tell me what car or budget you have in mind:`,
    suggestions: [
      "🚗 Browse Available Cars",
      "💰 Cars Under 2M KES",
      "🚙 Show SUVs & 4x4s",
      "⚡ Hybrid Cars",
      "📅 Book a Test Drive",
      "🏷️ How to Sell My Car",
      "📞 Chat with an Agent",
    ],
  };
}
