
// ===== Utilities =====
function parseEU(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  let s = String(val).trim();
  // remove thousand separators (dots) and convert decimal comma to dot
  s = s.replace(/\./g, '').replace(',', '.');
  const f = parseFloat(s);
  return isNaN(f) ? 0 : f;
}

function formatEU(num, decimals=2) {
  const n = (typeof num === 'number') ? num : parseFloat(num);
  if (!isFinite(n)) return '—';
  return n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ===== Core Calculation =====
function calcFactors() {
  const get = id => document.getElementById(id);

  const type = get('pd_type').value;
  const cat = get('pd_category').value;
  const hollows = parseEU(get('pd_hollows').value);
  const wall = parseEU(get('pd_wall').value);
  const slotDepth = parseEU(get('pd_slot_depth').value);
  const slotOpen = parseEU(get('pd_slot_open').value);
  const perimeter = parseEU(get('pd_perimeter').value);
  const weight = parseEU(get('pd_weight').value);
  const cavities = parseEU(get('pd_cavities').value);
  const cdmm = parseEU(get('pd_cd_mm').value);
  const pressIn = parseEU(get('pd_press_inch').value);
  const alloy = get('pd_alloy').value;
  const tol = get('pd_tol').value;
  const surface = get('pd_surface').value;

  // Calculations
  const tongue = slotOpen > 0 ? slotDepth / slotOpen : 0;
  const profileArea = (weight / 2700) * 1_000_000; // mm², per profile
  const wInDie = weight * cavities; // kg/m, with cavities
  const area = profileArea; // keep compatibility naming
 // mm²
  const pOverA = area > 0 ? perimeter / area : 0;
  const contD = pressIn * 25.4;
  const cArea = Math.PI * Math.pow(contD / 2, 2);
  const cdWall = wall > 0 ? cdmm / wall : 0;
  const ratio = profileArea > 0 ? cArea / (profileArea * cavities) : 0;

  // Show calculated (EU style)
  get('pd_calc_tongue').textContent = formatEU(tongue, 2);
  get('pd_calc_w_in_die').textContent = formatEU(wInDie, 2);
  get('pd_calc_area').textContent = formatEU(area, 2);
  get('pd_calc_p_over_a').textContent = formatEU(pOverA, 3);
  get('pd_calc_cont_d').textContent = formatEU(contD, 1);
  get('pd_calc_carea').textContent = formatEU(cArea, 1);
  get('pd_calc_cd_wall').textContent = formatEU(cdWall, 1);
  get('pd_calc_ratio').textContent = formatEU(ratio, 1);

  // ===== Factor rules (Excel-exact) =====
  // Profile Type
  const fType = (type === "Solid" ? 3 : (type === "Hollow" ? 10 : 0));

  // Category
  let fCat = 0;
  if (cat === "A") fCat = 1; else if (cat === "B") fCat = 3; else if (cat === "C") fCat = 6; else if (cat === "SP") fCat = 10;

  // Tongue ratio
  let fTongue = 0;
  if (tongue <= 3) fTongue = 1;
  else if (tongue <= 5) fTongue = 3;
  else if (tongue <= 7) fTongue = 5;
  else if (tongue >= 10) fTongue = 10;

  // Hollow sections
  let fHollows = 0;
  if (hollows === 0) fHollows = 0;
  else if (hollows === 1) fHollows = 2;
  else if (hollows >= 2 && hollows <= 3) fHollows = 4;
  else if (hollows >= 4 && hollows <= 6) fHollows = 8;
  else if (hollows > 6) fHollows = 10;

  // Wall thickness
  let fWall = 0;
  if (wall <= 1) fWall = 10;
  else if (wall >= 1 && wall < 1.5) fWall = 5;
  else if (wall >= 1.5 && wall <= 2.5) fWall = 3;
  else if (wall > 2.5) fWall = 1;

  // Perimeter/Area
  let fPA = 0;
  if (pOverA < 0.1) fPA = 2;
  else if (pOverA <= 0.14) fPA = 4;
  else if (pOverA <= 0.19) fPA = 6;
  else if (pOverA <= 0.29) fPA = 8;
  else fPA = 10;

  // Cavities
  let fCav = 0;
  if (cavities === 1) fCav = 1;
  else if (cavities === 2) fCav = 3;
  else if (cavities >= 3 && cavities <= 4) fCav = 6;
  else if (cavities >= 5 && cavities <= 8) fCav = 8;
  else if (cavities > 8) fCav = 10;

  // CD/wall
  let fCDWall = 0;
  if (cdWall <= 30) fCDWall = 1;
  else if (cdWall <= 40) fCDWall = 3;
  else if (cdWall <= 55) fCDWall = 6;
  else if (cdWall <= 70) fCDWall = 8;
  else fCDWall = 10;

  // Alloy
  let fAlloy = 0;
  if (alloy === "6060" || alloy === "6063" || alloy === "6463") fAlloy = 1;
  else if (alloy === "6101" || alloy === "6106") fAlloy = 5;
  else if (alloy === "6005A") fAlloy = 6;
  else if (alloy === "6061") fAlloy = 9;
  else if (alloy === "6082") fAlloy = 10;

  // Tolerance
  let fTol = 0;
  if (tol === "Acc. 755-9") fTol = 1;
  else if (tol === "Acc. 12020-2") fTol = 5;
  else if (tol === "> 30% < 755-9") fTol = 3;
  else if (tol === "> 30% < 12020-2") fTol = 8;
  else if (tol === "More restrictive") fTol = 10;

  // Surface
  let fSurf = 0;
  if (surface === "None") fSurf = 0;
  else if (surface === "Mill Finish") fSurf = 3;
  else if (surface === "Powder Coated") fSurf = 5;
  else if (surface === "Anodised") fSurf = 10;

  // Extrusion ratio
  let fRatio = 0;
  if (ratio < 10) fRatio = 8;
  else if (ratio < 30) fRatio = 2;
  else if (ratio >= 30 && ratio < 80) fRatio = 1;
  else if (ratio >= 80 && ratio <= 120) fRatio = 8;
  else if (ratio > 120) fRatio = 10;

  // Show factors (integers)
  get('pd_f_type_view').textContent = fType;
  get('pd_f_category_view').textContent = fCat;
  get('pd_f_tongue_view').textContent = fTongue;
  get('pd_f_hollows_view').textContent = fHollows;
  get('pd_f_wall_view').textContent = fWall;
  get('pd_f_povera_view').textContent = fPA;
  get('pd_f_cav_view').textContent = fCav;
  get('pd_f_cdwall_view').textContent = fCDWall;
  get('pd_f_alloy_view').textContent = fAlloy;
  get('pd_f_tol_view').textContent = fTol;
  get('pd_f_surface_view').textContent = fSurf;
  get('pd_f_ratio_view').textContent = fRatio;

  // Weights
  const weights = {
    type: parseEU(get('pd_w_type').value),
    category: parseEU(get('pd_w_category').value),
    tongue: parseEU(get('pd_w_tongue').value),
    hollows: parseEU(get('pd_w_hollows').value),
    wall: parseEU(get('pd_w_wall').value),
    povera: parseEU(get('pd_w_povera').value),
    cav: parseEU(get('pd_w_cav').value),
    cdwall: parseEU(get('pd_w_cdwall').value),
    alloy: parseEU(get('pd_w_alloy').value),
    tol: parseEU(get('pd_w_tol').value),
    surface: parseEU(get('pd_w_surface').value),
    ratio: parseEU(get('pd_w_ratio').value)
  };

  const factors = {
    type: fType, category: fCat, tongue: fTongue, hollows: fHollows,
    wall: fWall, povera: fPA, cav: fCav, cdwall: fCDWall,
    alloy: fAlloy, tol: fTol, surface: fSurf, ratio: fRatio
  };

  let scoreNum = 0, totalW = 0;
  for (const k in factors) {
    scoreNum += factors[k] * (weights[k] || 0);
    totalW += (weights[k] || 0);
  }
  let score = totalW > 0 ? (scoreNum / totalW) : 0; // 0–10
  score *= 10; // 0–100
  get('pd_res_score').textContent = formatEU(score, 1);

  let level = "—";
  if (score < 20) level = "Very easy";
  else if (score < 40) level = "Easy";
  else if (score < 60) level = "Normal";
  else if (score < 80) level = "Difficult";
  else level = "Very Difficult";
  get('pd_res_level').textContent = level;
}

function resetInputs(){
  // Only clear profile inputs
  const idsToReset = [
    'pd_slot_depth','pd_slot_open','pd_hollows','pd_wall','pd_perimeter',
    'pd_weight','pd_cavities','pd_cd_mm','sm_profile_ref'
  ];
  idsToReset.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset dropdowns for profile data to agreed defaults
  const defaults = {
    pd_type: 'Hollow',
    pd_category: 'B',
    pd_press_inch: '7',
    pd_alloy: '6063',
    pd_tol: 'Acc. 12020-2',
    pd_surface: 'Mill Finish'
  };
  for (const id in defaults) {
    const el = document.getElementById(id);
    if (el) el.value = defaults[id];
  }

  calcFactors();
}

// Attach listeners once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#profiledifficulty input, #profiledifficulty select').forEach(el => {
    el.addEventListener('input', calcFactors);
    el.addEventListener('change', calcFactors);
  });
  // Run once
  resetInputs();
  // Keep hollows = 0 when type is Solid
  document.getElementById('pd_type').addEventListener('change', () => {
    const type = document.getElementById('pd_type').value;
    const hollowsInput = document.getElementById('pd_hollows');
    if (type === 'Solid') {
      hollowsInput.value = '0';
      hollowsInput.disabled = true;
    } else {
      hollowsInput.disabled = false;
    }
    calcFactors();
  });

});

// ===== PDF Export =====
function exportReport(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'mm', format:'a4'});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const colGap = 6;

  // Header
  const company = (document.getElementById('gs_company_name').value||'').trim();
  const logoInput = document.getElementById('gs_company_logo');
  const logoData = logoInput && logoInput._dataUrl ? logoInput._dataUrl : null;

  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const dateStr = pad(now.getDate()) + '/' + pad(now.getMonth()+1) + '/' + now.getFullYear();

  let titleY = 32; // slightly lower per request
  let dateY = 36;
  let companyY = 36;

  if (logoData){
    const maxW = 32, maxH = 18;
    const props = doc.getImageProperties(logoData);
    const ratio = Math.min(maxW / props.width, maxH / props.height);
    const w = props.width * ratio;
    const h = props.height * ratio;
    const x = pageW - margin - w;
    const y = 12;
    doc.addImage(logoData, props.fileType || 'PNG', x, y, w, h);
    doc.setFont('helvetica','bold'); doc.setFontSize(13); // a bit bigger
    companyY = y + h + 6;
    doc.text(company, pageW - margin, companyY, {align:'right'});
    dateY = companyY + 4; // place a bit lower to avoid overlap
  } else if (company){
    doc.setFont('helvetica','bold'); doc.setFontSize(13);
    companyY = 30;
    doc.text(company, pageW - margin, companyY, {align:'right'});
    dateY = companyY;
  }

  // Title and Generated on
  doc.setFont('helvetica','bold'); doc.setFontSize(16);
  doc.text('Profile Difficulty Analysis', margin, titleY);
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text('Generated on ' + dateStr, margin, dateY);

  // Collect data
  const get = id => document.getElementById(id);
  const inputs = [
    ['Profile Type', get('pd_type').value],
    ['Category', get('pd_category').value],
    ['Slot depth (mm)', get('pd_slot_depth').value],
    ['Slot opening width (mm)', get('pd_slot_open').value],
    ['Hollow sections', get('pd_hollows').value],
    ['Wall thickness (mm)', get('pd_wall').value],
    ['Profile perimeter (mm)', get('pd_perimeter').value],
    ['Profile weight (kg/m)', get('pd_weight').value],
    ['Cavities in die', get('pd_cavities').value],
    ['CD (mm)', get('pd_cd_mm').value],
    ['Press size (inch)', get('pd_press_inch').value],
    ['Alloy', get('pd_alloy').value],
    ['Tolerance category', get('pd_tol').value],
    ['Surface class', get('pd_surface').value]
  ];
  const smInfo = [
    ['Sales Manager', get('sm_name').value || '—'],
    ['Quotation Date', get('sm_date').value || '—'],
    ['Client Company', get('sm_client').value || '—'],
    ['Profile Reference', get('sm_profile_ref').value || '—']
  ];
  const results = [
    ['Difficulty Score (0–100)', get('pd_res_score').textContent || '—'],
    ['Difficulty Level', get('pd_res_level').textContent || '—']
  ];
  const calcs = [
    ['Tongue ratio', get('pd_calc_tongue').textContent],
    ['Weight in die (kg/m)', get('pd_calc_w_in_die').textContent],
    ['Profile area (mm²)', get('pd_calc_area').textContent],
    ['Perimeter / Area', get('pd_calc_p_over_a').textContent],
    ['Container Ø (mm)', get('pd_calc_cont_d').textContent],
    ['Container area (mm²)', get('pd_calc_carea').textContent],
    ['CD / Wall', get('pd_calc_cd_wall').textContent],
    ['Extrusion ratio', get('pd_calc_ratio').textContent],
  ];
  const factors = [
    ['Profile Type', get('pd_f_type_view').textContent],
    ['Category', get('pd_f_category_view').textContent],
    ['Tongue ratio', get('pd_f_tongue_view').textContent],
    ['Hollow sections', get('pd_f_hollows_view').textContent],
    ['Wall thickness', get('pd_f_wall_view').textContent],
    ['Perimeter/Area', get('pd_f_povera_view').textContent],
    ['Cavities in die', get('pd_f_cav_view').textContent],
    ['CD/wall', get('pd_f_cdwall_view').textContent],
    ['Alloy', get('pd_f_alloy_view').textContent],
    ['Tolerance category', get('pd_f_tol_view').textContent],
    ['Surface class', get('pd_f_surface_view').textContent],
    ['Extrusion ratio', get('pd_f_ratio_view').textContent]
  ];
  const weights = [
    ['Profile Type', get('pd_w_type').value],
    ['Category', get('pd_w_category').value],
    ['Tongue ratio', get('pd_w_tongue').value],
    ['Hollow sections', get('pd_w_hollows').value],
    ['Wall thickness', get('pd_w_wall').value],
    ['Perimeter/Area', get('pd_w_povera').value],
    ['Cavities in die', get('pd_w_cav').value],
    ['CD/wall', get('pd_w_cdwall').value],
    ['Alloy', get('pd_w_alloy').value],
    ['Tolerance category', get('pd_w_tol').value],
    ['Surface class', get('pd_w_surface').value],
    ['Extrusion ratio', get('pd_w_ratio').value]
  ];

  const headerStyle = { fillColor:[180,180,180], textColor:20 };

  // First row: Inputs left, SM Info + Results stacked on right
  let yStart = Math.max(titleY, companyY) + 12;

  doc.autoTable({
    startY: yStart,
    head:[['Inputs','Value']],
    body: inputs,
    styles:{fontSize:9},
    headStyles: headerStyle,
    margin:{ left: margin, right: pageW/2 + colGap/2 }
  });
  const yInputs = doc.lastAutoTable.finalY;

  doc.autoTable({
    startY: yStart,
    head:[['Sales Manager Info','']],
    body: smInfo,
    styles:{fontSize:9},
    headStyles: headerStyle,
    margin:{ left: pageW/2 + colGap/2, right: margin }
  });
  const ySM = doc.lastAutoTable.finalY;

  doc.autoTable({
    head:[['Results','']],
    body: results,
    styles:{fontSize:9, halign:'left'},
    headStyles: headerStyle,
    bodyStyles:{ fillColor:[240,240,240] },
    margin:{ left: pageW/2 + colGap/2, right: margin }
  });
  const yResults = doc.lastAutoTable.finalY;

  // Second row: 3 columns
  let y = Math.max(yInputs, ySM, yResults) + 6;
  const colW3 = (pageW - 2*margin - 2*colGap) / 3;

  doc.autoTable({
    startY: y,
    head:[['Calculated','']],
    body: calcs,
    styles:{fontSize:9},
    headStyles: headerStyle,
    margin:{ left: margin },
    tableWidth: colW3
  });
  doc.autoTable({
    startY: y,
    head:[['Factors (0–10)','']],
    body: factors,
    styles:{fontSize:9},
    headStyles: headerStyle,
    margin:{ left: margin + colW3 + colGap },
    tableWidth: colW3
  });
  doc.autoTable({
    startY: y,
    head:[['Weights (0–100)','']],
    body: weights,
    styles:{fontSize:9},
    headStyles: headerStyle,
    margin:{ left: margin + 2*(colW3 + colGap) },
    tableWidth: colW3
  });

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i=1; i<=pageCount; i++) {
    doc.setPage(i);
    const yF = pageH - 8;
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    doc.text(company, margin, yF);
    doc.text('Page '+i+' of '+pageCount, pageW/2, yF, {align:'center'});
    doc.text('For internal use only – Confidential', pageW - margin, yF, {align:'right'});
  }

  const fname = `Profile_Difficulty_Report_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}.pdf`;
  doc.save(fname);
}
