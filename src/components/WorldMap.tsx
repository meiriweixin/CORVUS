import React, { useRef, useEffect } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { Globe } from 'lucide-react';
import { GlowEffect } from './ui/glow-effect';

interface WorldMapProps {
  victimCountries: Array<{ country: string; count: number }>;
}

// Comprehensive country name mapping to ISO2 codes for amCharts
const countryCodeMap: { [key: string]: string } = {
  // United States variations
  'United States': 'US', 'United States of America': 'US', 'USA': 'US', 'US': 'US', 'America': 'US',
  'united states': 'US', 'usa': 'US', 'us': 'US', 'america': 'US',
  
  // United Kingdom variations
  'United Kingdom': 'GB', 'UK': 'GB', 'Great Britain': 'GB', 'Britain': 'GB', 'England': 'GB',
  'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB', 'britain': 'GB', 'england': 'GB',
  
  // European countries
  'Germany': 'DE', 'Deutschland': 'DE', 'germany': 'DE',
  'France': 'FR', 'france': 'FR',
  'Italy': 'IT', 'italy': 'IT',
  'Spain': 'ES', 'spain': 'ES',
  'Netherlands': 'NL', 'Holland': 'NL', 'netherlands': 'NL', 'holland': 'NL',
  'Belgium': 'BE', 'belgium': 'BE',
  'Switzerland': 'CH', 'switzerland': 'CH',
  'Austria': 'AT', 'austria': 'AT',
  'Denmark': 'DK', 'denmark': 'DK',
  'Sweden': 'SE', 'sweden': 'SE',
  'Norway': 'NO', 'norway': 'NO',
  'Finland': 'FI', 'finland': 'FI',
  'Poland': 'PL', 'poland': 'PL',
  'Czech Republic': 'CZ', 'Czechia': 'CZ', 'czech republic': 'CZ', 'czechia': 'CZ',
  'Hungary': 'HU', 'hungary': 'HU',
  'Slovakia': 'SK', 'slovakia': 'SK',
  'Slovenia': 'SI', 'slovenia': 'SI',
  'Croatia': 'HR', 'croatia': 'HR',
  'Romania': 'RO', 'romania': 'RO',
  'Bulgaria': 'BG', 'bulgaria': 'BG',
  'Greece': 'GR', 'greece': 'GR',
  'Portugal': 'PT', 'portugal': 'PT',
  'Ireland': 'IE', 'ireland': 'IE',
  'Luxembourg': 'LU', 'luxembourg': 'LU',
  'Malta': 'MT', 'malta': 'MT',
  'Cyprus': 'CY', 'cyprus': 'CY',
  'Estonia': 'EE', 'estonia': 'EE',
  'Latvia': 'LV', 'latvia': 'LV',
  'Lithuania': 'LT', 'lithuania': 'LT',
  
  // Americas
  'Canada': 'CA', 'canada': 'CA',
  'Mexico': 'MX', 'mexico': 'MX',
  'Brazil': 'BR', 'brazil': 'BR',
  'Argentina': 'AR', 'argentina': 'AR',
  'Chile': 'CL', 'chile': 'CL',
  'Colombia': 'CO', 'colombia': 'CO',
  'Peru': 'PE', 'peru': 'PE',
  'Venezuela': 'VE', 'venezuela': 'VE',
  'Ecuador': 'EC', 'ecuador': 'EC',
  'Uruguay': 'UY', 'uruguay': 'UY',
  'Paraguay': 'PY', 'paraguay': 'PY',
  'Bolivia': 'BO', 'bolivia': 'BO',
  'Guyana': 'GY', 'guyana': 'GY',
  'Suriname': 'SR', 'suriname': 'SR',
  
  // Asia
  'China': 'CN', 'People\'s Republic of China': 'CN', 'PRC': 'CN',
  'china': 'CN', 'prc': 'CN',
  'Japan': 'JP', 'japan': 'JP',
  'South Korea': 'KR', 'Korea': 'KR', 'Republic of Korea': 'KR',
  'south korea': 'KR', 'korea': 'KR',
  'North Korea': 'KP', 'north korea': 'KP',
  'India': 'IN', 'india': 'IN',
  'Indonesia': 'ID', 'indonesia': 'ID',
  'Thailand': 'TH', 'thailand': 'TH',
  'Vietnam': 'VN', 'Viet Nam': 'VN', 'vietnam': 'VN',
  'Philippines': 'PH', 'philippines': 'PH',
  'Malaysia': 'MY', 'malaysia': 'MY',
  'Singapore': 'SG', 'singapore': 'SG',
  'Bangladesh': 'BD', 'bangladesh': 'BD',
  'Sri Lanka': 'LK', 'sri lanka': 'LK',
  'Myanmar': 'MM', 'Burma': 'MM', 'myanmar': 'MM', 'burma': 'MM',
  'Cambodia': 'KH', 'cambodia': 'KH',
  'Laos': 'LA', 'laos': 'LA',
  'Nepal': 'NP', 'nepal': 'NP',
  'Bhutan': 'BT', 'bhutan': 'BT',
  'Mongolia': 'MN', 'mongolia': 'MN',
  
  // Pakistan and variations
  'Pakistan': 'PK', 'pakistan': 'PK', 'PAKISTAN': 'PK',
  
  // Ukraine and variations  
  'Ukraine': 'UA', 'ukraine': 'UA', 'UKRAINE': 'UA',
  
  // Russia and variations
  'Russia': 'RU', 'Russian Federation': 'RU', 'USSR': 'RU', 'Soviet Union': 'RU',
  'russia': 'RU', 'russian federation': 'RU',
  
  // Oceania
  'Australia': 'AU', 'australia': 'AU',
  'New Zealand': 'NZ', 'new zealand': 'NZ',
  'Fiji': 'FJ', 'fiji': 'FJ',
  'Papua New Guinea': 'PG', 'papua new guinea': 'PG',
  
  // Middle East
  'Turkey': 'TR', 'Türkiye': 'TR', 'turkey': 'TR',
  'Israel': 'IL', 'israel': 'IL',
  'Iran': 'IR', 'Islamic Republic of Iran': 'IR', 'iran': 'IR',
  'Iraq': 'IQ', 'iraq': 'IQ',
  'Saudi Arabia': 'SA', 'saudi arabia': 'SA',
  'UAE': 'AE', 'United Arab Emirates': 'AE', 'uae': 'AE',
  'Kuwait': 'KW', 'kuwait': 'KW',
  'Qatar': 'QA', 'qatar': 'QA',
  'Bahrain': 'BH', 'bahrain': 'BH',
  'Oman': 'OM', 'oman': 'OM',
  'Yemen': 'YE', 'yemen': 'YE',
  'Jordan': 'JO', 'jordan': 'JO',
  'Lebanon': 'LB', 'lebanon': 'LB',
  'Syria': 'SY', 'syria': 'SY',
  'Cyprus': 'CY', 'cyprus': 'CY',
  
  // Africa
  'Egypt': 'EG', 'egypt': 'EG',
  'South Africa': 'ZA', 'south africa': 'ZA',
  'Nigeria': 'NG', 'nigeria': 'NG',
  'Kenya': 'KE', 'kenya': 'KE',
  'Morocco': 'MA', 'morocco': 'MA',
  'Algeria': 'DZ', 'algeria': 'DZ',
  'Tunisia': 'TN', 'tunisia': 'TN',
  'Libya': 'LY', 'libya': 'LY',
  'Ghana': 'GH', 'ghana': 'GH',
  'Ethiopia': 'ET', 'ethiopia': 'ET',
  'Tanzania': 'TZ', 'tanzania': 'TZ',
  'Uganda': 'UG', 'uganda': 'UG',
  'Zimbabwe': 'ZW', 'zimbabwe': 'ZW',
  'Zambia': 'ZM', 'zambia': 'ZM',
  'Botswana': 'BW', 'botswana': 'BW',
  'Namibia': 'NA', 'namibia': 'NA',
  'Angola': 'AO', 'angola': 'AO',
  'Mozambique': 'MZ', 'mozambique': 'MZ',
  'Madagascar': 'MG', 'madagascar': 'MG',
  'Congo': 'CG', 'congo': 'CG',
  'Democratic Republic of Congo': 'CD', 'democratic republic of congo': 'CD',
  'Cameroon': 'CM', 'cameroon': 'CM',
  'Ivory Coast': 'CI', 'ivory coast': 'CI', 'Cote d\'Ivoire': 'CI',
  'Senegal': 'SN', 'senegal': 'SN',
  'Mali': 'ML', 'mali': 'ML',
  'Burkina Faso': 'BF', 'burkina faso': 'BF',
  'Niger': 'NE', 'niger': 'NE',
  'Chad': 'TD', 'chad': 'TD',
  'Sudan': 'SD', 'sudan': 'SD',
  'South Sudan': 'SS', 'south sudan': 'SS',
  'Somalia': 'SO', 'somalia': 'SO',
  'Rwanda': 'RW', 'rwanda': 'RW',
  'Burundi': 'BI', 'burundi': 'BI',
  'Malawi': 'MW', 'malawi': 'MW',
  'Lesotho': 'LS', 'lesotho': 'LS',
  'Swaziland': 'SZ', 'swaziland': 'SZ', 'Eswatini': 'SZ',
  
  // Central Asia
  'Kazakhstan': 'KZ', 'kazakhstan': 'KZ',
  'Uzbekistan': 'UZ', 'uzbekistan': 'UZ',
  'Turkmenistan': 'TM', 'turkmenistan': 'TM',
  'Kyrgyzstan': 'KG', 'kyrgyzstan': 'KG',
  'Tajikistan': 'TJ', 'tajikistan': 'TJ',
  'Afghanistan': 'AF', 'afghanistan': 'AF',
  
  // Caribbean & Small Nations
  'Cuba': 'CU', 'cuba': 'CU',
  'Jamaica': 'JM', 'jamaica': 'JM',
  'Haiti': 'HT', 'haiti': 'HT',
  'Dominican Republic': 'DO', 'dominican republic': 'DO',
  'Trinidad and Tobago': 'TT', 'trinidad and tobago': 'TT',
  'Barbados': 'BB', 'barbados': 'BB',
  'Bahamas': 'BS', 'bahamas': 'BS',
  
  // Common ISO codes as fallbacks
  'AF': 'AF', 'AL': 'AL', 'DZ': 'DZ', 'AS': 'AS', 'AD': 'AD', 'AO': 'AO', 'AI': 'AI', 'AQ': 'AQ',
  'AG': 'AG', 'AR': 'AR', 'AM': 'AM', 'AW': 'AW', 'AU': 'AU', 'AT': 'AT', 'AZ': 'AZ', 'BS': 'BS',
  'BH': 'BH', 'BD': 'BD', 'BB': 'BB', 'BY': 'BY', 'BE': 'BE', 'BZ': 'BZ', 'BJ': 'BJ', 'BM': 'BM',
  'BT': 'BT', 'BO': 'BO', 'BA': 'BA', 'BW': 'BW', 'BV': 'BV', 'BR': 'BR', 'IO': 'IO', 'BN': 'BN',
  'BG': 'BG', 'BF': 'BF', 'BI': 'BI', 'KH': 'KH', 'CM': 'CM', 'CA': 'CA', 'CV': 'CV', 'KY': 'KY',
  'CF': 'CF', 'TD': 'TD', 'CL': 'CL', 'CN': 'CN', 'CX': 'CX', 'CC': 'CC', 'CO': 'CO', 'KM': 'KM',
  'CG': 'CG', 'CD': 'CD', 'CK': 'CK', 'CR': 'CR', 'CI': 'CI', 'HR': 'HR', 'CU': 'CU', 'CY': 'CY',
  'CZ': 'CZ', 'DK': 'DK', 'DJ': 'DJ', 'DM': 'DM', 'DO': 'DO', 'EC': 'EC', 'EG': 'EG', 'SV': 'SV',
  'GQ': 'GQ', 'ER': 'ER', 'EE': 'EE', 'ET': 'ET', 'FK': 'FK', 'FO': 'FO', 'FJ': 'FJ', 'FI': 'FI',
  'FR': 'FR', 'GF': 'GF', 'PF': 'PF', 'TF': 'TF', 'GA': 'GA', 'GM': 'GM', 'GE': 'GE', 'DE': 'DE',
  'GH': 'GH', 'GI': 'GI', 'GR': 'GR', 'GL': 'GL', 'GD': 'GD', 'GP': 'GP', 'GU': 'GU', 'GT': 'GT',
  'GN': 'GN', 'GW': 'GW', 'GY': 'GY', 'HT': 'HT', 'HM': 'HM', 'VA': 'VA', 'HN': 'HN', 'HK': 'HK',
  'HU': 'HU', 'IS': 'IS', 'IN': 'IN', 'ID': 'ID', 'IR': 'IR', 'IQ': 'IQ', 'IE': 'IE', 'IL': 'IL',
  'IT': 'IT', 'JM': 'JM', 'JP': 'JP', 'JO': 'JO', 'KZ': 'KZ', 'KE': 'KE', 'KI': 'KI', 'KP': 'KP',
  'KR': 'KR', 'KW': 'KW', 'KG': 'KG', 'LA': 'LA', 'LV': 'LV', 'LB': 'LB', 'LS': 'LS', 'LR': 'LR',
  'LY': 'LY', 'LI': 'LI', 'LT': 'LT', 'LU': 'LU', 'MO': 'MO', 'MK': 'MK', 'MG': 'MG', 'MW': 'MW',
  'MY': 'MY', 'MV': 'MV', 'ML': 'ML', 'MT': 'MT', 'MH': 'MH', 'MQ': 'MQ', 'MR': 'MR', 'MU': 'MU',
  'YT': 'YT', 'MX': 'MX', 'FM': 'FM', 'MD': 'MD', 'MC': 'MC', 'MN': 'MN', 'MS': 'MS', 'MA': 'MA',
  'MZ': 'MZ', 'MM': 'MM', 'NA': 'NA', 'NR': 'NR', 'NP': 'NP', 'NL': 'NL', 'AN': 'AN', 'NC': 'NC',
  'NZ': 'NZ', 'NI': 'NI', 'NE': 'NE', 'NG': 'NG', 'NU': 'NU', 'NF': 'NF', 'MP': 'MP', 'NO': 'NO',
  'OM': 'OM', 'PK': 'PK', 'PW': 'PW', 'PS': 'PS', 'PA': 'PA', 'PG': 'PG', 'PY': 'PY', 'PE': 'PE',
  'PH': 'PH', 'PN': 'PN', 'PL': 'PL', 'PT': 'PT', 'PR': 'PR', 'QA': 'QA', 'RE': 'RE', 'RO': 'RO',
  'RU': 'RU', 'RW': 'RW', 'SH': 'SH', 'KN': 'KN', 'LC': 'LC', 'PM': 'PM', 'VC': 'VC', 'WS': 'WS',
  'SM': 'SM', 'ST': 'ST', 'SA': 'SA', 'SN': 'SN', 'CS': 'CS', 'SC': 'SC', 'SL': 'SL', 'SG': 'SG',
  'SK': 'SK', 'SI': 'SI', 'SB': 'SB', 'SO': 'SO', 'ZA': 'ZA', 'GS': 'GS', 'ES': 'ES', 'LK': 'LK',
  'SD': 'SD', 'SR': 'SR', 'SJ': 'SJ', 'SZ': 'SZ', 'SE': 'SE', 'CH': 'CH', 'SY': 'SY', 'TW': 'TW',
  'TJ': 'TJ', 'TZ': 'TZ', 'TH': 'TH', 'TL': 'TL', 'TG': 'TG', 'TK': 'TK', 'TO': 'TO', 'TT': 'TT',
  'TN': 'TN', 'TR': 'TR', 'TM': 'TM', 'TC': 'TC', 'TV': 'TV', 'UG': 'UG', 'UA': 'UA', 'AE': 'AE',
  'GB': 'GB',  'UM': 'UM', 'UY': 'UY', 'UZ': 'UZ', 'VU': 'VU', 'VE': 'VE', 'VN': 'VN',
  'VG': 'VG', 'VI': 'VI', 'WF': 'WF', 'EH': 'EH', 'YE': 'YE', 'ZM': 'ZM', 'ZW': 'ZW'
};

export const WorldMap: React.FC<WorldMapProps> = ({ victimCountries }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Create root
    const root = am5.Root.new(chartRef.current);
    rootRef.current = root;

    // Set themes
    root.setThemes([
      am5themes_Dark.new(root),
      am5themes_Animated.new(root)
    ]);

    // Create the map chart
    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: "translateX",
        panY: "translateY",
        projection: am5map.geoMercator(),
        paddingBottom: 20,
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 40
      })
    );

    // Prepare data for heat map - EXACT structure from working example
    console.log('Raw victim countries data:', victimCountries);
    
    const mapData = victimCountries.map(item => {
      // Try multiple variations to find the right country code
      let countryCode = countryCodeMap[item.country];
      
      if (!countryCode) {
        // Try trimmed and case variations
        countryCode = countryCodeMap[item.country.trim()];
      }
      
      if (!countryCode) {
        // Try without special characters
        const cleanCountry = item.country.replace(/[^\w\s]/g, '').trim();
        countryCode = countryCodeMap[cleanCountry];
      }
      
      if (!countryCode) {
        // Try common variations
        const variations = [
          item.country.toLowerCase(),
          item.country.toUpperCase(),
          item.country.replace(/\s+/g, ''),
          item.country.split(',')[0].trim(), // In case there are comma-separated values
          item.country.split('(')[0].trim()  // Remove parenthetical info
        ];
        
        for (const variation of variations) {
          if (countryCodeMap[variation]) {
            countryCode = countryCodeMap[variation];
            break;
          }
        }
      }
      
      // Final fallback - use the original country name as uppercase
      if (!countryCode) {
        countryCode = item.country.toUpperCase().substring(0, 2);
      }
      
      console.log(`Mapping "${item.country}" -> "${countryCode}" (${item.count} incidents)`);
      
      // EXACT data structure from working example: {id: "CN", threatened: 34}
      return {
        id: countryCode,
        threatened: item.count  // Changed from "incidents" to "threatened" to match example
      };
    });

    console.log('Processed map data:', mapData);

    // Create polygon series - EXACT configuration from working example
    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow,
        valueField: "threatened", // MUST match the data field name exactly
        calculateAggregates: false, // Try without aggregates
        exclude: ["AQ"] // Exclude Antarctica
      })
    );

    // Configure heat rules FIRST - BEFORE setting data (critical for amCharts)
    polygonSeries.set("heatRules", [{
      target: polygonSeries.mapPolygons.template,
      dataField: "value", // amCharts processes "threatened" field into "value"
      min: am5.color("#374151"), // Dark gray for 0 incidents
      max: am5.color("#DC2626"), // Dark red for highest incidents  
      key: "fill"
    }]);

    // Configure polygon template
    polygonSeries.mapPolygons.template.setAll({
      tooltipText: "{name}: {value} incidents",
      fill: am5.color("#374151"), // Default gray for countries with no data
      stroke: am5.color("#ffffff"),
      strokeWidth: 0.5,
      interactive: true
    });

    // Configure hover state
    polygonSeries.mapPolygons.template.states.create("hover", {
      stroke: am5.color("#60A5FA"),
      strokeWidth: 2
    });

    // Set the data LAST - AFTER configuring heat rules
    polygonSeries.data.setAll(mapData);

    // Create heat legend
    const heatLegend = chart.children.push(am5.HeatLegend.new(root, {
      orientation: "vertical",
      startColor: am5.color("#374151"),
      endColor: am5.color("#DC2626"),
      startText: "0",
      endText: "Max",
      stepCount: 5,
      x: am5.percent(100),
      centerX: am5.percent(100),
      y: am5.percent(50),
      centerY: am5.percent(50),
      paddingRight: 20,
      paddingTop: 20,
      paddingBottom: 20
    }));

    // Style legend labels
    heatLegend.startLabel.setAll({
      fontSize: 11,
      fill: am5.color("#9CA3AF")
    });

    heatLegend.endLabel.setAll({
      fontSize: 11,
      fill: am5.color("#9CA3AF")
    });

    // Force update legend and heat map after data processing
    polygonSeries.events.on("datavalidated", function () {
      const valueLow = polygonSeries.getPrivate("valueLow") || 0;
      const valueHigh = polygonSeries.getPrivate("valueHigh") || 1;
      
      console.log(`🔥 Heat map range: ${valueLow} to ${valueHigh}`);
      console.log(`🔥 Total polygons: ${polygonSeries.mapPolygons.length}`);
      
      heatLegend.set("startValue", valueLow);
      heatLegend.set("endValue", valueHigh);
      
      // Debug all countries with data
      let countriesWithData = 0;
      polygonSeries.mapPolygons.each(function(mapPolygon) {
        const dataItem = mapPolygon.dataItem;
        if (dataItem) {
          const value = dataItem.get("value" as any);
          const id = dataItem.get("id" as any);
          const threatened = dataItem.get("threatened" as any);
          
          if (value !== undefined && value !== null && value > 0) {
            countriesWithData++;
            console.log(`🎯 Country ${id}: value=${value}, threatened=${threatened}, fill=${mapPolygon.get("fill")}`);
            
            // Force re-apply heat rules for this country
            const heatRules = polygonSeries.get("heatRules");
            if (heatRules && heatRules.length > 0) {
              const rule = heatRules[0];
              const normalizedValue = (value - valueLow) / (valueHigh - valueLow);
              const color = am5.Color.interpolate(normalizedValue, rule.min, rule.max);
              console.log(`🎨 Setting ${id} color to:`, color?.toString());
              mapPolygon.set("fill", color);
            }
          }
        }
      });
      
      console.log(`🔥 Found ${countriesWithData} countries with data`);
    });

    // Show value on legend when hovering over countries
    polygonSeries.mapPolygons.template.events.on("pointerover", function (ev) {
      const dataItem = ev.target.dataItem;
      if (dataItem) {
        const value = dataItem.get("value" as any);
        if (value !== undefined && value !== null) {
          heatLegend.showValue(value as number);
        }
      }
    });

    // Add chart animation
    chart.appear(1000, 100);

    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
      }
    };
  }, [victimCountries]);

  const totalIncidents = victimCountries.reduce((sum, country) => sum + country.count, 0);
  const topCountries = victimCountries.slice(0, 5);

  return (
    <div className="relative">
      <GlowEffect
        colors={['#EF4444', '#F59E0B']}
        mode="alternate"
        blur="soft"
        duration={8}
        className="-inset-1 rounded-xl opacity-20"
      />
      <div className="relative bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Global Cyber Incidents Heat Map
            </h3>
            <div 
              ref={chartRef} 
              className="w-full h-[400px] bg-gray-800/20 rounded-lg"
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Statistics */}
          <div className="lg:w-80 space-y-4">
            <div className="bg-gray-800/40 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Incident Statistics</h4>
              <div className="text-2xl font-bold text-white mb-1">{totalIncidents}</div>
              <div className="text-sm text-gray-400">Total Incidents</div>
            </div>

            <div className="bg-gray-800/40 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Top Affected Countries</h4>
              <div className="space-y-3">
                {topCountries.map((country, index) => {
                  const percentage = (country.count / totalIncidents) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 truncate">{country.country}</span>
                        <span className="text-gray-400">{country.count}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-800/40 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Heat Map Legend</h4>
              <div className="text-sm text-gray-400 space-y-1">
                <div>• Darker red = More incidents</div>
                <div>• Dark gray = No incidents</div>
                <div>• Hover for exact counts</div>
                <div>• Drag to pan, scroll to zoom</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 