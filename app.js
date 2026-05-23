/**
 * Calculates bicycle tire pressure in the browser and persists local rider/bike profiles.
 * Include from index.html; no backend or network access is used.
 */

(() => {
  "use strict";

  const STORAGE_KEY = "jtirepresscalc:v1";
  const PSI_TO_BAR = 0.0689476;

  const SURFACES = [
    { id: "new-pavement", label: "Route neuve", detail: "Asphalte lisse · K1 261", k1: 261 },
    { id: "worn-pavement", label: "Route usée", detail: "Fissures légères · K1 246.5", k1: 246.5 },
    { id: "cat1-gravel", label: "Gravel cat. 1", detail: "Compact rapide · K1 235.5", k1: 235.5 },
    { id: "poor-pavement", label: "Chipseal", detail: "Route rugueuse · K1 225", k1: 225 },
    { id: "cat2-gravel", label: "Gravel cat. 2", detail: "Roulant irrégulier · K1 212.5", k1: 212.5 },
    { id: "cobblestone", label: "Pavés", detail: "Rugueux · K1 199", k1: 199 },
    { id: "cat3-gravel", label: "Gravel cat. 3", detail: "Cassant · K1 187", k1: 187 },
    { id: "cat4-gravel", label: "Gravel cat. 4", detail: "Très dégradé · K1 170", k1: 170 },
  ];

  const RIDES = [
    { id: "recreational", label: "Détente", detail: "≈ 22 km/h", speedMph: 14 },
    { id: "fast-singletrack", label: "Singletrack", detail: "≈ 24 km/h", speedMph: 15.5 },
    { id: "moderate-group", label: "Groupe modéré", detail: "≈ 28 km/h", speedMph: 17.5 },
    { id: "fast-group", label: "Groupe rapide", detail: "≈ 31 km/h", speedMph: 19.5 },
    { id: "race", label: "Course", detail: "≈ 34 km/h", speedMph: 21.5 },
    { id: "pro", label: "Pro", detail: "≈ 38 km/h", speedMph: 24 },
  ];

  const WHEEL_DIAMETERS = [
    { id: "622", label: "700C / 29\"" },
    { id: "584", label: "650B / 27.5\"" },
    { id: "571", label: "650C" },
    { id: "559", label: "26\"" },
  ];

  const WEIGHT_DISTRIBUTIONS = [
    { id: "tr-tt-track", label: "50/50 · Triathlon / TT / piste", front: 1, rear: 1 },
    { id: "road", label: "48/52 · Route", front: 0.985, rear: 1.01 },
    { id: "gravel", label: "47/53 · Gravel", front: 0.975, rear: 1.02 },
    { id: "mountain", label: "46.5/53.5 · VTT", front: 0.97, rear: 1.03 },
  ];

  const TIRE_TYPES = [
    { id: "high-perf-tubeless-latex", label: "Pneu haut rendement · tubeless ou chambre latex", front: 1, rear: 1 },
    { id: "high-perf-tpu", label: "Pneu haut rendement · chambre TPU légère", front: 0.99, rear: 0.99 },
    { id: "mid-range-tubeless-latex", label: "Pneu standard souple · tubeless ou chambre latex", front: 0.97, rear: 0.97 },
    { id: "mid-range-tpu", label: "Pneu standard souple · chambre TPU", front: 0.965, rear: 0.965 },
    { id: "mid-range-butyl", label: "Pneu standard · chambre butyl", front: 0.94, rear: 0.94 },
    { id: "puncture-resistant-tubeless-latex", label: "Pneu renforcé anti-crevaison", front: 0.91, rear: 0.91 },
  ];

  const DEFAULT_STATE = {
    riders: [],
    bikes: [],
    selectedRiderId: "",
    selectedBikeId: "",
    selectedSurface: "new-pavement",
    selectedRide: "moderate-group",
  };

  const numberFormats = {
    bar: new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    psi: new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    one: new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
  };

  let state = loadState();
  let lastResult = null;
  let refs = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    refs = {
      riderSelect: document.getElementById("riderSelect"),
      bikeSelect: document.getElementById("bikeSelect"),
      addRiderButton: document.getElementById("addRiderButton"),
      editRiderButton: document.getElementById("editRiderButton"),
      addBikeButton: document.getElementById("addBikeButton"),
      editBikeButton: document.getElementById("editBikeButton"),
      resetButton: document.getElementById("resetButton"),
      openSurfaceGuideButton: document.getElementById("openSurfaceGuideButton"),
      surfaceGuideDialog: document.getElementById("surfaceGuideDialog"),
      surfaceGrid: document.getElementById("surfaceGrid"),
      rideGrid: document.getElementById("rideGrid"),
      selectionSummary: document.getElementById("selectionSummary"),
      emptyState: document.getElementById("emptyState"),
      pressureResults: document.getElementById("pressureResults"),
      frontBar: document.getElementById("frontBar"),
      rearBar: document.getElementById("rearBar"),
      frontPsi: document.getElementById("frontPsi"),
      rearPsi: document.getElementById("rearPsi"),
      frontGauge: document.getElementById("frontGauge"),
      rearGauge: document.getElementById("rearGauge"),
      alerts: document.getElementById("alerts"),
      copyButton: document.getElementById("copyButton"),
      riderDialog: document.getElementById("riderDialog"),
      riderForm: document.getElementById("riderForm"),
      riderDialogTitle: document.getElementById("riderDialogTitle"),
      riderId: document.getElementById("riderId"),
      riderName: document.getElementById("riderName"),
      riderWeight: document.getElementById("riderWeight"),
      deleteRiderButton: document.getElementById("deleteRiderButton"),
      bikeDialog: document.getElementById("bikeDialog"),
      bikeForm: document.getElementById("bikeForm"),
      bikeDialogTitle: document.getElementById("bikeDialogTitle"),
      bikeId: document.getElementById("bikeId"),
      bikeName: document.getElementById("bikeName"),
      bikeWeight: document.getElementById("bikeWeight"),
      bikeTireWidth: document.getElementById("bikeTireWidth"),
      bikeWheelDiameter: document.getElementById("bikeWheelDiameter"),
      bikeWeightDistribution: document.getElementById("bikeWeightDistribution"),
      bikeTireType: document.getElementById("bikeTireType"),
      deleteBikeButton: document.getElementById("deleteBikeButton"),
    };

    populateBikeDialogSelects();
    bindEvents();
    renderAll();
  }

  function bindEvents() {
    refs.riderSelect.addEventListener("change", () => {
      state.selectedRiderId = refs.riderSelect.value;
      persistAndRender();
    });

    refs.bikeSelect.addEventListener("change", () => {
      state.selectedBikeId = refs.bikeSelect.value;
      persistAndRender();
    });

    refs.addRiderButton.addEventListener("click", () => openRiderDialog());
    refs.editRiderButton.addEventListener("click", () => openRiderDialog(getSelectedRider()));
    refs.addBikeButton.addEventListener("click", () => openBikeDialog());
    refs.editBikeButton.addEventListener("click", () => openBikeDialog(getSelectedBike()));

    refs.resetButton.addEventListener("click", () => {
      state.selectedSurface = DEFAULT_STATE.selectedSurface;
      state.selectedRide = DEFAULT_STATE.selectedRide;
      persistAndRender();
    });

    refs.openSurfaceGuideButton.addEventListener("click", () => {
      showDialog(refs.surfaceGuideDialog);
    });

    refs.copyButton.addEventListener("click", copyPressures);
    refs.riderForm.addEventListener("submit", saveRiderFromDialog);
    refs.bikeForm.addEventListener("submit", saveBikeFromDialog);
    refs.deleteRiderButton.addEventListener("click", deleteSelectedRiderFromDialog);
    refs.deleteBikeButton.addEventListener("click", deleteSelectedBikeFromDialog);

    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(document.getElementById(button.dataset.closeDialog)));
    });

    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          closeDialog(dialog);
        }
      });
    });
  }

  function renderAll() {
    normalizeState();
    renderProfileSelects();
    renderChoiceGrid(refs.surfaceGrid, SURFACES, state.selectedSurface, (id) => {
      state.selectedSurface = id;
      persistAndRender();
    });
    renderChoiceGrid(refs.rideGrid, RIDES, state.selectedRide, (id) => {
      state.selectedRide = id;
      persistAndRender();
    });
    renderResult();
  }

  function persistAndRender() {
    saveState(state);
    renderAll();
  }

  function renderProfileSelects() {
    renderRiderSelect();
    renderBikeSelect();
  }

  function renderRiderSelect() {
    refs.riderSelect.replaceChildren();

    if (state.riders.length === 0) {
      refs.riderSelect.append(createOption("", "Aucun cycliste enregistré"));
      refs.riderSelect.disabled = true;
      refs.editRiderButton.disabled = true;
      return;
    }

    state.riders.forEach((rider) => {
      refs.riderSelect.append(createOption(rider.id, `${rider.name} · ${formatOne(rider.weightKg)} kg`));
    });
    refs.riderSelect.value = state.selectedRiderId;
    refs.riderSelect.disabled = false;
    refs.editRiderButton.disabled = false;
  }

  function renderBikeSelect() {
    refs.bikeSelect.replaceChildren();

    if (state.bikes.length === 0) {
      refs.bikeSelect.append(createOption("", "Aucun vélo enregistré"));
      refs.bikeSelect.disabled = true;
      refs.editBikeButton.disabled = true;
      return;
    }

    state.bikes.forEach((bike) => {
      refs.bikeSelect.append(createOption(bike.id, `${bike.name} · ${bike.tireWidthMm} mm · ${formatOne(bike.bikeAndGearWeightKg)} kg`));
    });
    refs.bikeSelect.value = state.selectedBikeId;
    refs.bikeSelect.disabled = false;
    refs.editBikeButton.disabled = false;
  }

  function renderChoiceGrid(container, options, selectedId, onSelect) {
    const buttons = options.map((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice-card${option.id === selectedId ? " is-active" : ""}`;
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-pressed", String(option.id === selectedId));

      const title = document.createElement("strong");
      title.textContent = option.label;
      const detail = document.createElement("span");
      detail.textContent = option.detail;

      button.append(title, detail);
      button.addEventListener("click", () => onSelect(option.id));
      return button;
    });

    container.replaceChildren(...buttons);
  }

  function renderResult() {
    const rider = getSelectedRider();
    const bike = getSelectedBike();
    const surface = getSelectedSurface();
    const ride = getSelectedRide();
    const hasProfiles = Boolean(rider && bike);

    renderSelectionSummary(rider, bike, surface, ride);
    refs.alerts.replaceChildren();
    lastResult = null;

    if (!hasProfiles) {
      refs.emptyState.classList.remove("is-hidden");
      refs.pressureResults.classList.add("is-hidden");
      refs.copyButton.classList.add("is-hidden");
      return;
    }

    const result = calculatePressure({ rider, bike, surface, ride });
    if (result.error) {
      refs.emptyState.classList.remove("is-hidden");
      refs.emptyState.textContent = result.error;
      refs.pressureResults.classList.add("is-hidden");
      refs.copyButton.classList.add("is-hidden");
      renderAlerts([{ type: "warning", title: "Poids total hors plage", text: result.error }]);
      return;
    }

    lastResult = result;
    refs.emptyState.classList.add("is-hidden");
    refs.emptyState.textContent = "Ajoutez un cycliste et un vélo pour lancer le calcul.";
    refs.pressureResults.classList.remove("is-hidden");
    refs.copyButton.classList.remove("is-hidden");

    refs.frontBar.textContent = formatBar(result.frontBar);
    refs.rearBar.textContent = formatBar(result.rearBar);
    refs.frontPsi.textContent = `${formatPsi(result.frontPsi)} PSI`;
    refs.rearPsi.textContent = `${formatPsi(result.rearPsi)} PSI`;
    refs.frontGauge.style.width = `${pressureGaugePercent(result.frontBar)}%`;
    refs.rearGauge.style.width = `${pressureGaugePercent(result.rearBar)}%`;
    renderAlerts(createResultAlerts(result));
  }

  function renderSelectionSummary(rider, bike, surface, ride) {
    const chips = [];
    chips.push(rider ? `Cycliste: ${rider.name}` : "Cycliste à ajouter");
    chips.push(bike ? `Vélo: ${bike.name}` : "Vélo à ajouter");

    if (rider && bike) {
      chips.push(`Total: ${formatOne(rider.weightKg + bike.bikeAndGearWeightKg)} kg`);
      chips.push(`${bike.tireWidthMm} mm`);
    }

    chips.push(surface.label);
    chips.push(ride.label);

    refs.selectionSummary.replaceChildren(...chips.map((text) => {
      const chip = document.createElement("span");
      chip.className = "summary-chip";
      chip.textContent = text;
      return chip;
    }));
  }

  function renderAlerts(alerts) {
    const nodes = alerts.map((alert) => {
      const node = document.createElement("div");
      node.className = `alert ${alert.type}`;

      const title = document.createElement("strong");
      title.textContent = alert.title;
      const text = document.createElement("span");
      text.textContent = ` ${alert.text}`;

      node.append(title, text);
      return node;
    });

    refs.alerts.replaceChildren(...nodes);
  }

  function createResultAlerts(result) {
    const alerts = [];

    if (result.hooklessWarning) {
      alerts.push({
        type: "warning",
        title: "Alerte hookless.",
        text: "Si vous utilisez des jantes hookless ou tubeless straight side, vérifiez impérativement la limite fabricant. SILCA signale une attention au-delà de 70 PSI.",
      });
    }

    if (result.pinchFlatRisk === "extreme") {
      alerts.push({
        type: "danger",
        title: "Risque extrême de pincement.",
        text: `Largeur recommandée: ${result.recommendedWidthMm} mm. Si ce n'est pas possible, pressions alternatives: ${formatPsi(result.frontAlternativePsi)} PSI avant et ${formatPsi(result.rearAlternativePsi)} PSI arrière.`,
      });
    } else if (result.pinchFlatRisk === "increased") {
      alerts.push({
        type: "warning",
        title: "Risque accru de pincement.",
        text: `Largeur recommandée: ${result.recommendedWidthMm} mm. Alternative non optimale: ${formatPsi(result.frontAlternativePsi)} PSI avant et ${formatPsi(result.rearAlternativePsi)} PSI arrière.`,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: "good",
        title: "Point de départ cohérent.",
        text: "Aucun signal de risque calculé. Vérifiez tout de même les limites de vos pneus et jantes.",
      });
    }

    return alerts;
  }

  function calculatePressure({ rider, bike, surface, ride }) {
    const massKg = rider.weightKg + bike.bikeAndGearWeightKg;
    if (massKg < 34 || massKg > 205) {
      return { error: "Le poids total système doit rester entre 34 et 205 kg pour respecter la plage de validation du modèle SILCA." };
    }

    const width = bike.tireWidthMm;
    const diameter = bike.wheelDiameterMm;
    const k = 0.5 * (massKg - 50) + surface.k1;
    const cpp = calculateCpp({ width, diameter, k });
    const speedCoefficient = 0.97 + ((ride.speedMph - 10) * 0.06 / 23);
    const distribution = findById(WEIGHT_DISTRIBUTIONS, bike.weightDistribution) || WEIGHT_DISTRIBUTIONS[1];
    const tireType = findById(TIRE_TYPES, bike.tireType) || TIRE_TYPES[0];

    const rawFrontPsi = cpp * speedCoefficient * distribution.front * tireType.front;
    const rawRearPsi = cpp * speedCoefficient * distribution.rear * tireType.rear;
    const frontPsi = roundTo(rawFrontPsi, 0.5);
    const rearPsi = roundTo(rawRearPsi, 0.5);
    const frontBar = roundTo(rawFrontPsi * PSI_TO_BAR, 0.05);
    const rearBar = roundTo(rawRearPsi * PSI_TO_BAR, 0.05);
    const pinchFlat = calculatePinchFlat({ massKg, speedMph: ride.speedMph, width, k, rawFrontPsi, rawRearPsi });

    return {
      rider,
      bike,
      surface,
      ride,
      massKg,
      k,
      cpp,
      frontPsi,
      rearPsi,
      frontBar,
      rearBar,
      rawFrontPsi,
      rawRearPsi,
      hooklessWarning: frontPsi > 70 || rearPsi > 70,
      ...pinchFlat,
    };
  }

  function calculateCpp({ width, diameter, k }) {
    const num = ((-0.00006 * width ** 3) + (0.0079 * width ** 2) - (0.4102 * width) + 12.725) * -226.44;
    const denom = ((((-0.5 * 9.81) / (k * (20 / width))) + (width + (diameter / 2))) ** 2) - ((width + (diameter / 2)) ** 2);
    return num / denom;
  }

  function calculatePinchFlat({ massKg, speedMph, width, k, rawFrontPsi, rawRearPsi }) {
    const speedMs = speedMph * 0.44704;
    const kineticEnergy = 0.5 * massKg * speedMs ** 2;
    const rimEnergy = 0.5 * (0.8 * width) * Math.sqrt(Math.max(0, k ** 2 - (0.8 * width) ** 2));
    const pinchFlatFactor = (2 * rimEnergy) - kineticEnergy;
    let pinchFlatRisk = "none";

    if (pinchFlatFactor >= -500 && pinchFlatFactor <= 0) {
      pinchFlatRisk = "increased";
    } else if (pinchFlatFactor < -500) {
      pinchFlatRisk = "extreme";
    }

    if (pinchFlatRisk === "none") {
      return { pinchFlatRisk, pinchFlatFactor };
    }

    const widthNumeratorOne = -2.56 * k ** 2;
    const widthSqrtTwo = 6.5536 * k ** 4;
    const widthSqrtThree = 6.5536 * (-160000 - (800 * massKg * speedMs ** 2) - (massKg ** 2 * speedMs ** 4));
    const widthNumerator = widthNumeratorOne + Math.sqrt(Math.max(0, widthSqrtTwo + widthSqrtThree));
    const recommendedWidth = Math.sqrt(Math.max(0, -widthNumerator / 3.2768));
    const alternativeNumerator = Math.sqrt((((25 * massKg ** 2 * speedMs ** 4) + (20000 * massKg * speedMs ** 2) + 400000) / (64 * width ** 2)) + (0.64 * width ** 2));
    const alternativeRatio = alternativeNumerator / k;

    return {
      pinchFlatRisk,
      pinchFlatFactor,
      recommendedWidthMm: Math.ceil(recommendedWidth),
      frontAlternativePsi: roundTo(alternativeRatio * rawFrontPsi, 0.5),
      rearAlternativePsi: roundTo(alternativeRatio * rawRearPsi, 0.5),
    };
  }

  function openRiderDialog(rider = null) {
    refs.riderForm.reset();
    refs.riderId.value = rider?.id || "";
    refs.riderName.value = rider?.name || "";
    refs.riderWeight.value = rider?.weightKg ?? "";
    refs.riderDialogTitle.textContent = rider ? "Modifier le cycliste" : "Ajouter un cycliste";
    refs.deleteRiderButton.classList.toggle("is-hidden", !rider);
    showDialog(refs.riderDialog);
    refs.riderName.focus();
  }

  function openBikeDialog(bike = null) {
    refs.bikeForm.reset();
    refs.bikeId.value = bike?.id || "";
    refs.bikeName.value = bike?.name || "";
    refs.bikeWeight.value = bike?.bikeAndGearWeightKg ?? "";
    refs.bikeTireWidth.value = bike?.tireWidthMm ?? "";
    refs.bikeWheelDiameter.value = String(bike?.wheelDiameterMm || 622);
    refs.bikeWeightDistribution.value = bike?.weightDistribution || "road";
    refs.bikeTireType.value = bike?.tireType || "high-perf-tubeless-latex";
    refs.bikeDialogTitle.textContent = bike ? "Modifier le vélo" : "Ajouter un vélo";
    refs.deleteBikeButton.classList.toggle("is-hidden", !bike);
    showDialog(refs.bikeDialog);
    refs.bikeName.focus();
  }

  function saveRiderFromDialog(event) {
    event.preventDefault();
    if (!refs.riderForm.reportValidity()) {
      return;
    }

    const id = refs.riderId.value || createId("rider");
    const rider = {
      id,
      name: refs.riderName.value.trim(),
      weightKg: parseNumericInput(refs.riderWeight.value),
    };
    const index = state.riders.findIndex((item) => item.id === id);

    if (index >= 0) {
      state.riders[index] = rider;
    } else {
      state.riders.push(rider);
    }

    state.selectedRiderId = id;
    closeDialog(refs.riderDialog);
    persistAndRender();
  }

  function saveBikeFromDialog(event) {
    event.preventDefault();
    if (!refs.bikeForm.reportValidity()) {
      return;
    }

    const id = refs.bikeId.value || createId("bike");
    const bike = {
      id,
      name: refs.bikeName.value.trim(),
      bikeAndGearWeightKg: parseNumericInput(refs.bikeWeight.value),
      tireWidthMm: parseNumericInput(refs.bikeTireWidth.value),
      wheelDiameterMm: Number(refs.bikeWheelDiameter.value),
      weightDistribution: refs.bikeWeightDistribution.value,
      tireType: refs.bikeTireType.value,
    };
    const index = state.bikes.findIndex((item) => item.id === id);

    if (index >= 0) {
      state.bikes[index] = bike;
    } else {
      state.bikes.push(bike);
    }

    state.selectedBikeId = id;
    closeDialog(refs.bikeDialog);
    persistAndRender();
  }

  function deleteSelectedRiderFromDialog() {
    const id = refs.riderId.value;
    if (!id || !window.confirm("Supprimer ce cycliste ?")) {
      return;
    }

    state.riders = state.riders.filter((rider) => rider.id !== id);
    if (state.selectedRiderId === id) {
      state.selectedRiderId = state.riders[0]?.id || "";
    }
    closeDialog(refs.riderDialog);
    persistAndRender();
  }

  function deleteSelectedBikeFromDialog() {
    const id = refs.bikeId.value;
    if (!id || !window.confirm("Supprimer ce vélo ?")) {
      return;
    }

    state.bikes = state.bikes.filter((bike) => bike.id !== id);
    if (state.selectedBikeId === id) {
      state.selectedBikeId = state.bikes[0]?.id || "";
    }
    closeDialog(refs.bikeDialog);
    persistAndRender();
  }

  function populateBikeDialogSelects() {
    populateSelect(refs.bikeWheelDiameter, WHEEL_DIAMETERS.map((wheel) => ({ id: wheel.id, label: wheel.label })));
    populateSelect(refs.bikeWeightDistribution, WEIGHT_DISTRIBUTIONS.map((distribution) => ({ id: distribution.id, label: distribution.label })));
    populateSelect(refs.bikeTireType, TIRE_TYPES.map((type) => ({ id: type.id, label: type.label })));
  }

  function populateSelect(select, options) {
    select.replaceChildren(...options.map((option) => createOption(option.id, option.label)));
  }

  function copyPressures() {
    if (!lastResult) {
      return;
    }

    const text = [
      `Pressions ${lastResult.bike.name}`,
      `Cycliste: ${lastResult.rider.name}`,
      `Terrain: ${lastResult.surface.label}`,
      `Sortie: ${lastResult.ride.label}`,
      `Avant: ${formatBar(lastResult.frontBar)} bar (${formatPsi(lastResult.frontPsi)} PSI)`,
      `Arrière: ${formatBar(lastResult.rearBar)} bar (${formatPsi(lastResult.rearPsi)} PSI)`,
    ].join("\n");

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        flashCopyButton("Copié");
      }).catch(() => fallbackCopy(text));
      return;
    }

    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    window.prompt("Copiez les pressions", text);
    flashCopyButton("Prêt à copier");
  }

  function flashCopyButton(label) {
    const original = refs.copyButton.textContent;
    refs.copyButton.textContent = label;
    window.setTimeout(() => {
      refs.copyButton.textContent = original;
    }, 1400);
  }

  function normalizeState() {
    if (!state.riders.some((rider) => rider.id === state.selectedRiderId)) {
      state.selectedRiderId = state.riders[0]?.id || "";
    }

    if (!state.bikes.some((bike) => bike.id === state.selectedBikeId)) {
      state.selectedBikeId = state.bikes[0]?.id || "";
    }

    if (!findById(SURFACES, state.selectedSurface)) {
      state.selectedSurface = DEFAULT_STATE.selectedSurface;
    }

    if (!findById(RIDES, state.selectedRide)) {
      state.selectedRide = DEFAULT_STATE.selectedRide;
    }
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneDefaultState();
      }

      const parsed = JSON.parse(raw);
      return sanitizeState({ ...DEFAULT_STATE, ...parsed });
    } catch {
      return cloneDefaultState();
    }
  }

  function cloneDefaultState() {
    return {
      ...DEFAULT_STATE,
      riders: [],
      bikes: [],
    };
  }

  function sanitizeState(candidate) {
    const riders = Array.isArray(candidate.riders) ? candidate.riders.map(sanitizeRider).filter(Boolean) : [];
    const bikes = Array.isArray(candidate.bikes) ? candidate.bikes.map(sanitizeBike).filter(Boolean) : [];

    return {
      riders,
      bikes,
      selectedRiderId: typeof candidate.selectedRiderId === "string" ? candidate.selectedRiderId : "",
      selectedBikeId: typeof candidate.selectedBikeId === "string" ? candidate.selectedBikeId : "",
      selectedSurface: typeof candidate.selectedSurface === "string" ? candidate.selectedSurface : DEFAULT_STATE.selectedSurface,
      selectedRide: typeof candidate.selectedRide === "string" ? candidate.selectedRide : DEFAULT_STATE.selectedRide,
    };
  }

  function sanitizeRider(rider) {
    const weightKg = Number(rider?.weightKg);
    if (!rider?.id || !rider?.name || !Number.isFinite(weightKg)) {
      return null;
    }

    return {
      id: String(rider.id),
      name: String(rider.name).slice(0, 40),
      weightKg,
    };
  }

  function sanitizeBike(bike) {
    const bikeAndGearWeightKg = Number(bike?.bikeAndGearWeightKg);
    const tireWidthMm = Number(bike?.tireWidthMm);
    const wheelDiameterMm = Number(bike?.wheelDiameterMm);
    if (!bike?.id || !bike?.name || !Number.isFinite(bikeAndGearWeightKg) || !Number.isFinite(tireWidthMm) || !Number.isFinite(wheelDiameterMm)) {
      return null;
    }

    return {
      id: String(bike.id),
      name: String(bike.name).slice(0, 40),
      bikeAndGearWeightKg,
      tireWidthMm,
      wheelDiameterMm,
      weightDistribution: findById(WEIGHT_DISTRIBUTIONS, bike.weightDistribution) ? bike.weightDistribution : "road",
      tireType: findById(TIRE_TYPES, bike.tireType) ? bike.tireType : "high-perf-tubeless-latex",
    };
  }

  function saveState(nextState) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // The calculator still works without persistence if storage is unavailable.
    }
  }

  function getSelectedRider() {
    return findById(state.riders, state.selectedRiderId);
  }

  function getSelectedBike() {
    return findById(state.bikes, state.selectedBikeId);
  }

  function getSelectedSurface() {
    return findById(SURFACES, state.selectedSurface) || SURFACES[0];
  }

  function getSelectedRide() {
    return findById(RIDES, state.selectedRide) || RIDES[2];
  }

  function findById(items, id) {
    return items.find((item) => item.id === id);
  }

  function createOption(value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }

  function createId(prefix) {
    if (window.crypto?.randomUUID) {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function parseNumericInput(value) {
    return Number(String(value).replace(",", "."));
  }

  function roundTo(value, step) {
    return Math.round(value / step) * step;
  }

  function pressureGaugePercent(bar) {
    return clamp((bar / 8) * 100, 4, 100);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatBar(value) {
    return numberFormats.bar.format(value);
  }

  function formatPsi(value) {
    return numberFormats.psi.format(value);
  }

  function formatOne(value) {
    return numberFormats.one.format(value);
  }

  function showDialog(dialog) {
    if (dialog.showModal) {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog(dialog) {
    if (dialog.close) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }
})();
