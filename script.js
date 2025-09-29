// Heavy Metal Pollution Index Calculator
// Advanced client-side application for groundwater quality analysis

class HMPICalculator {
  constructor() {
    this.samples = []
    this.results = []
    this.currentChart = "bar"
    this.isDarkMode = false

    // WHO/EPA standards for heavy metals (mg/L)
    this.standards = {
      cd: 0.003, // Cadmium
      pb: 0.01, // Lead
      cr: 0.05, // Chromium
      cu: 2.0, // Copper
      zn: 3.0, // Zinc
      ni: 0.07, // Nickel
    }

    // Relative weights for HMPI calculation
    this.weights = {
      cd: 0.2,
      pb: 0.2,
      cr: 0.15,
      cu: 0.15,
      zn: 0.15,
      ni: 0.15,
    }

    // Metal information for tooltips
    this.metalInfo = {
      cd: {
        name: "Cadmium",
        effects: "Kidney damage, bone disease, cancer risk",
        sources: "Industrial discharge, mining, batteries",
        limit: "0.003 mg/L (WHO)",
      },
      pb: {
        name: "Lead",
        effects: "Neurological damage, developmental issues, cardiovascular problems",
        sources: "Old pipes, paint, industrial processes",
        limit: "0.01 mg/L (WHO)",
      },
      cr: {
        name: "Chromium",
        effects: "Skin irritation, respiratory problems, cancer risk",
        sources: "Industrial processes, leather tanning, steel production",
        limit: "0.05 mg/L (WHO)",
      },
      cu: {
        name: "Copper",
        effects: "Gastrointestinal distress, liver damage (high doses)",
        sources: "Plumbing, mining, agricultural runoff",
        limit: "2.0 mg/L (WHO)",
      },
      zn: {
        name: "Zinc",
        effects: "Nausea, vomiting, immune system effects (high doses)",
        sources: "Galvanized pipes, mining, industrial discharge",
        limit: "3.0 mg/L (WHO)",
      },
      ni: {
        name: "Nickel",
        effects: "Allergic reactions, respiratory issues, cancer risk",
        sources: "Industrial processes, mining, stainless steel",
        limit: "0.07 mg/L (WHO)",
      },
    }

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.loadTheme()
    this.initializeCharts()
    this.initializeMap()
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", () => this.toggleTheme())

    // Help modal
    document.getElementById("helpBtn").addEventListener("click", () => this.showModal("helpModal"))

    // Tab navigation
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.switchTab(e.target.dataset.tab))
    })

    // Manual form submission
    document.getElementById("manualForm").addEventListener("submit", (e) => this.handleManualSubmit(e))

    // File upload
    const fileInput = document.getElementById("fileInput")
    const fileUploadArea = document.getElementById("fileUploadArea")

    fileInput.addEventListener("change", (e) => this.handleFileUpload(e))
    fileUploadArea.addEventListener("click", () => fileInput.click())
    fileUploadArea.addEventListener("dragover", (e) => this.handleDragOver(e))
    fileUploadArea.addEventListener("drop", (e) => this.handleFileDrop(e))

    // Batch actions
    document.getElementById("calculateAllBtn").addEventListener("click", () => this.calculateAllHMPI())
    document.getElementById("clearAllBtn").addEventListener("click", () => this.clearAllSamples())
    document.getElementById("exportBtn").addEventListener("click", () => this.exportResults())

    // Filter and sort controls
    document.getElementById("categoryFilter").addEventListener("change", () => this.filterResults())
    document.getElementById("sortBy").addEventListener("change", () => this.sortResults())

    // Chart controls
    document.querySelectorAll(".chart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.switchChart(e.target.dataset.chart))
    })

    // Metal info buttons
    document.querySelectorAll(".info-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.showMetalInfo(e.target.dataset.metal))
    })

    // Modal close buttons
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", (e) => this.closeModal(e.target.closest(".modal")))
    })

    // Close modals on outside click
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.closeModal(modal)
      })
    })

    // Map canvas events
    const mapCanvas = document.getElementById("mapCanvas")
    mapCanvas.addEventListener("mousemove", (e) => this.handleMapHover(e))
    mapCanvas.addEventListener("mouseleave", () => this.hideMapTooltip())
  }

  // Theme Management
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode
    document.body.classList.toggle("dark", this.isDarkMode)

    const themeIcon = document.querySelector(".theme-icon")
    themeIcon.textContent = this.isDarkMode ? "☀️" : "🌙"

    localStorage.setItem("hmpi-theme", this.isDarkMode ? "dark" : "light")

    // Redraw charts and map with new theme
    this.updateVisualization()
    this.updateMap()
  }

  loadTheme() {
    const savedTheme = localStorage.getItem("hmpi-theme")
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      this.isDarkMode = true
      document.body.classList.add("dark")
      document.querySelector(".theme-icon").textContent = "☀️"
    }
  }

  // Tab Management
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"))
    document.getElementById(`${tabName}-tab`).classList.add("active")

    // Update visualizations if switching to relevant tabs
    if (tabName === "visualization") {
      this.updateVisualization()
    } else if (tabName === "map") {
      this.updateMap()
    }
  }

  // Sample Management
  handleManualSubmit(e) {
    e.preventDefault()

    try {
      const formData = new FormData(e.target)
      const sample = {
        id: Date.now().toString(),
        name: formData.get("sampleName"),
        latitude: Number.parseFloat(formData.get("latitude")) || null,
        longitude: Number.parseFloat(formData.get("longitude")) || null,
        metals: {
          cd: Number.parseFloat(formData.get("cd")),
          pb: Number.parseFloat(formData.get("pb")),
          cr: Number.parseFloat(formData.get("cr")),
          cu: Number.parseFloat(formData.get("cu")),
          zn: Number.parseFloat(formData.get("zn")),
          ni: Number.parseFloat(formData.get("ni")),
        },
      }

      this.validateSample(sample)
      this.addSample(sample)
      e.target.reset()
    } catch (error) {
      this.showError(error.message)
    }
  }

  validateSample(sample) {
    if (!sample.name.trim()) {
      throw new Error("Sample name is required")
    }

    for (const [metal, value] of Object.entries(sample.metals)) {
      if (isNaN(value) || value < 0) {
        throw new Error(`Invalid ${metal.toUpperCase()} concentration`)
      }
    }

    if (sample.latitude !== null && (sample.latitude < -90 || sample.latitude > 90)) {
      throw new Error("Latitude must be between -90 and 90 degrees")
    }

    if (sample.longitude !== null && (sample.longitude < -180 || sample.longitude > 180)) {
      throw new Error("Longitude must be between -180 and 180 degrees")
    }
  }

  addSample(sample) {
    this.samples.push(sample)
    this.updateSamplesList()
    this.showBatchActions()
  }

  updateSamplesList() {
    const container = document.getElementById("samplesContainer")

    if (this.samples.length === 0) {
      container.innerHTML = '<p class="no-samples">No samples added yet</p>'
      return
    }

    container.innerHTML = this.samples
      .map(
        (sample) => `
            <div class="sample-item" data-id="${sample.id}">
                <div class="sample-info">
                    <h4>${sample.name}</h4>
                    <p>Metals: Cd=${sample.metals.cd}, Pb=${sample.metals.pb}, Cr=${sample.metals.cr}, Cu=${sample.metals.cu}, Zn=${sample.metals.zn}, Ni=${sample.metals.ni}</p>
                    ${sample.latitude && sample.longitude ? `<p>Location: ${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}</p>` : ""}
                </div>
                <div class="sample-actions">
                    <button class="btn btn-primary btn-small" onclick="hmpiCalc.calculateSingleHMPI('${sample.id}')">Calculate</button>
                    <button class="btn btn-secondary btn-small" onclick="hmpiCalc.removeSample('${sample.id}')">Remove</button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  removeSample(id) {
    this.samples = this.samples.filter((sample) => sample.id !== id)
    this.results = this.results.filter((result) => result.id !== id)
    this.updateSamplesList()
    this.updateResultsTable()
    this.updateVisualization()
    this.updateMap()

    if (this.samples.length === 0) {
      this.hideBatchActions()
    }
  }

  showBatchActions() {
    document.getElementById("batchActions").style.display = "flex"
  }

  hideBatchActions() {
    document.getElementById("batchActions").style.display = "none"
  }

  clearAllSamples() {
    if (confirm("Are you sure you want to clear all samples and results?")) {
      this.samples = []
      this.results = []
      this.updateSamplesList()
      this.updateResultsTable()
      this.updateVisualization()
      this.updateMap()
      this.hideBatchActions()
    }
  }

  // File Upload Handling
  handleDragOver(e) {
    e.preventDefault()
    e.currentTarget.classList.add("dragover")
  }

  handleFileDrop(e) {
    e.preventDefault()
    e.currentTarget.classList.remove("dragover")

    const files = e.dataTransfer.files
    if (files.length > 0) {
      this.processFile(files[0])
    }
  }

  handleFileUpload(e) {
    const file = e.target.files[0]
    if (file) {
      this.processFile(file)
    }
  }

  processFile(file) {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target.result
        let data

        if (file.name.endsWith(".json")) {
          data = JSON.parse(content)
        } else if (file.name.endsWith(".csv")) {
          data = this.parseCSV(content)
        } else {
          throw new Error("Unsupported file format. Please use CSV or JSON.")
        }

        this.processBatchData(data)
      } catch (error) {
        this.showError(`Error processing file: ${error.message}`)
      }
    }

    reader.readAsText(file)
  }

  parseCSV(content) {
    const lines = content.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())

    const expectedHeaders = ["sampleName", "latitude", "longitude", "cd", "pb", "cr", "cu", "zn", "ni"]
    const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h))

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`)
    }

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const row = {}

      headers.forEach((header, index) => {
        row[header] = values[index]
      })

      return row
    })
  }

  processBatchData(data) {
    if (!Array.isArray(data)) {
      throw new Error("Data must be an array of samples")
    }

    let successCount = 0
    let errorCount = 0

    data.forEach((item, index) => {
      try {
        const sample = {
          id: `${Date.now()}_${index}`,
          name: item.sampleName || `Sample ${index + 1}`,
          latitude: item.latitude ? Number.parseFloat(item.latitude) : null,
          longitude: item.longitude ? Number.parseFloat(item.longitude) : null,
          metals: {
            cd: Number.parseFloat(item.cd),
            pb: Number.parseFloat(item.pb),
            cr: Number.parseFloat(item.cr),
            cu: Number.parseFloat(item.cu),
            zn: Number.parseFloat(item.zn),
            ni: Number.parseFloat(item.ni),
          },
        }

        this.validateSample(sample)
        this.addSample(sample)
        successCount++
      } catch (error) {
        console.error(`Error processing sample ${index + 1}:`, error)
        errorCount++
      }
    })

    if (successCount > 0) {
      alert(`Successfully imported ${successCount} samples${errorCount > 0 ? ` (${errorCount} errors)` : ""}`)
    } else {
      throw new Error("No valid samples found in the file")
    }
  }

  // HMPI Calculation
  calculateHMPI(metals) {
    let hmpi = 0
    let totalWeight = 0

    for (const [metal, concentration] of Object.entries(metals)) {
      const standard = this.standards[metal]
      const weight = this.weights[metal]

      if (standard && weight) {
        const ratio = concentration / standard
        hmpi += ratio * weight * 100
        totalWeight += weight
      }
    }

    return hmpi / totalWeight
  }

  categorizeHMPI(hmpi) {
    if (hmpi <= 100) return "safe"
    if (hmpi <= 200) return "moderate"
    return "hazardous"
  }

  getDominantMetal(metals) {
    let maxRatio = 0
    let dominantMetal = ""

    for (const [metal, concentration] of Object.entries(metals)) {
      const standard = this.standards[metal]
      if (standard) {
        const ratio = concentration / standard
        if (ratio > maxRatio) {
          maxRatio = ratio
          dominantMetal = metal.toUpperCase()
        }
      }
    }

    return dominantMetal || "N/A"
  }

  calculateSingleHMPI(sampleId) {
    const sample = this.samples.find((s) => s.id === sampleId)
    if (!sample) return

    const hmpi = this.calculateHMPI(sample.metals)
    const category = this.categorizeHMPI(hmpi)
    const dominantMetal = this.getDominantMetal(sample.metals)

    const result = {
      id: sample.id,
      name: sample.name,
      latitude: sample.latitude,
      longitude: sample.longitude,
      metals: sample.metals,
      hmpi: hmpi,
      category: category,
      dominantMetal: dominantMetal,
      calculatedAt: new Date().toISOString(),
    }

    // Update or add result
    const existingIndex = this.results.findIndex((r) => r.id === sampleId)
    if (existingIndex >= 0) {
      this.results[existingIndex] = result
    } else {
      this.results.push(result)
    }

    this.updateResultsTable()
    this.updateVisualization()
    this.updateMap()

    // Switch to results tab
    this.switchTab("results")
  }

  calculateAllHMPI() {
    if (this.samples.length === 0) {
      this.showError("No samples available for calculation")
      return
    }

    this.samples.forEach((sample) => {
      this.calculateSingleHMPI(sample.id)
    })

    alert(`Calculated HMPI for ${this.samples.length} samples`)
  }

  // Results Management
  updateResultsTable() {
    const tbody = document.getElementById("resultsTableBody")
    const summary = document.getElementById("resultsSummary")

    if (this.results.length === 0) {
      tbody.innerHTML =
        '<tr class="no-results"><td colspan="6">No results available. Please add samples and calculate HMPI.</td></tr>'
      summary.style.display = "none"
      return
    }

    // Update summary
    const counts = {
      safe: this.results.filter((r) => r.category === "safe").length,
      moderate: this.results.filter((r) => r.category === "moderate").length,
      hazardous: this.results.filter((r) => r.category === "hazardous").length,
    }

    document.getElementById("safeCount").textContent = counts.safe
    document.getElementById("moderateCount").textContent = counts.moderate
    document.getElementById("hazardousCount").textContent = counts.hazardous
    summary.style.display = "grid"

    // Update table
    tbody.innerHTML = this.results
      .map(
        (result) => `
            <tr>
                <td><strong>${result.name}</strong></td>
                <td>${result.latitude && result.longitude ? `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}` : "N/A"}</td>
                <td><strong>${result.hmpi.toFixed(2)}</strong></td>
                <td><span class="category-badge ${result.category}">${result.category}</span></td>
                <td>${result.dominantMetal}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="hmpiCalc.showSampleDetails('${result.id}')">Details</button>
                    <button class="btn btn-secondary btn-small" onclick="hmpiCalc.removeSample('${result.id}')">Remove</button>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  filterResults() {
    const filter = document.getElementById("categoryFilter").value
    const rows = document.querySelectorAll("#resultsTableBody tr:not(.no-results)")

    rows.forEach((row) => {
      const badge = row.querySelector(".category-badge")
      if (!badge) return

      const category = badge.classList.contains("safe")
        ? "safe"
        : badge.classList.contains("moderate")
          ? "moderate"
          : "hazardous"

      row.style.display = filter === "all" || filter === category ? "" : "none"
    })
  }

  sortResults() {
    const sortBy = document.getElementById("sortBy").value

    this.results.sort((a, b) => {
      switch (sortBy) {
        case "hmpi-desc":
          return b.hmpi - a.hmpi
        case "hmpi-asc":
          return a.hmpi - b.hmpi
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    this.updateResultsTable()
  }

  showSampleDetails(sampleId) {
    const result = this.results.find((r) => r.id === sampleId)
    if (!result) return

    const modal = document.getElementById("metalInfoModal")
    const title = document.getElementById("metalInfoTitle")
    const body = document.getElementById("metalInfoBody")

    title.textContent = `Sample Details: ${result.name}`

    body.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <h4>HMPI Analysis</h4>
                <p><strong>HMPI Value:</strong> ${result.hmpi.toFixed(2)}</p>
                <p><strong>Category:</strong> <span class="category-badge ${result.category}">${result.category}</span></p>
                <p><strong>Dominant Metal:</strong> ${result.dominantMetal}</p>
                ${result.latitude && result.longitude ? `<p><strong>Location:</strong> ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}</p>` : ""}
            </div>
            
            <div>
                <h4>Metal Concentrations</h4>
                <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <th style="text-align: left; padding: 0.5rem;">Metal</th>
                            <th style="text-align: left; padding: 0.5rem;">Concentration (mg/L)</th>
                            <th style="text-align: left; padding: 0.5rem;">WHO Limit</th>
                            <th style="text-align: left; padding: 0.5rem;">Ratio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(result.metals)
                          .map(([metal, conc]) => {
                            const standard = this.standards[metal]
                            const ratio = conc / standard
                            const status = ratio > 1 ? "color: var(--danger)" : "color: var(--success)"
                            return `
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 0.5rem;">${metal.toUpperCase()}</td>
                                    <td style="padding: 0.5rem;">${conc.toFixed(4)}</td>
                                    <td style="padding: 0.5rem;">${standard}</td>
                                    <td style="padding: 0.5rem; ${status}">${ratio.toFixed(2)}x</td>
                                </tr>
                            `
                          })
                          .join("")}
                    </tbody>
                </table>
            </div>
        `

    this.showModal("metalInfoModal")
  }

  exportResults() {
    if (this.results.length === 0) {
      this.showError("No results to export")
      return
    }

    const csvContent = [
      "Sample Name,Latitude,Longitude,HMPI,Category,Dominant Metal,Cd,Pb,Cr,Cu,Zn,Ni",
      ...this.results.map((result) =>
        [
          result.name,
          result.latitude || "",
          result.longitude || "",
          result.hmpi.toFixed(2),
          result.category,
          result.dominantMetal,
          result.metals.cd,
          result.metals.pb,
          result.metals.cr,
          result.metals.cu,
          result.metals.zn,
          result.metals.ni,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hmpi_results_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Visualization
  initializeCharts() {
    this.chartCanvas = document.getElementById("chartCanvas")
    this.chartCtx = this.chartCanvas.getContext("2d")
    this.updateVisualization()
  }

  switchChart(chartType) {
    this.currentChart = chartType

    document.querySelectorAll(".chart-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`[data-chart="${chartType}"]`).classList.add("active")

    this.updateVisualization()
  }

  updateVisualization() {
    if (this.results.length === 0) {
      this.clearChart()
      document.getElementById("chartInfo").innerHTML = "<p>Add samples and calculate HMPI to view visualizations</p>"
      return
    }

    document.getElementById("chartInfo").innerHTML = ""

    switch (this.currentChart) {
      case "bar":
        this.drawBarChart()
        break
      case "pie":
        this.drawPieChart()
        break
      case "line":
        this.drawLineChart()
        break
    }
  }

  clearChart() {
    this.chartCtx.clearRect(0, 0, this.chartCanvas.width, this.chartCanvas.height)
    document.getElementById("chartLegend").innerHTML = ""
  }

  drawBarChart() {
    const canvas = this.chartCanvas
    const ctx = this.chartCtx

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const padding = 60
    const chartWidth = canvas.width - 2 * padding
    const chartHeight = canvas.height - 2 * padding

    const maxHMPI = Math.max(...this.results.map((r) => r.hmpi))
    const barWidth = (chartWidth / this.results.length) * 0.8
    const barSpacing = (chartWidth / this.results.length) * 0.2

    // Set colors based on theme
    const textColor = this.isDarkMode ? "#f8fafc" : "#1e293b"
    const gridColor = this.isDarkMode ? "#475569" : "#e2e8f0"

    // Draw grid lines and labels
    ctx.strokeStyle = gridColor
    ctx.fillStyle = textColor
    ctx.font = "12px sans-serif"
    ctx.lineWidth = 1

    // Y-axis labels and grid
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      const value = maxHMPI - (maxHMPI / 5) * i

      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + chartWidth, y)
      ctx.stroke()

      ctx.fillText(value.toFixed(0), 10, y + 4)
    }

    // Draw bars
    this.results.forEach((result, index) => {
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2
      const barHeight = (result.hmpi / maxHMPI) * chartHeight
      const y = padding + chartHeight - barHeight

      // Color based on category
      ctx.fillStyle = result.category === "safe" ? "#10b981" : result.category === "moderate" ? "#f59e0b" : "#ef4444"

      ctx.fillRect(x, y, barWidth, barHeight)

      // Sample name
      ctx.fillStyle = textColor
      ctx.save()
      ctx.translate(x + barWidth / 2, padding + chartHeight + 20)
      ctx.rotate(-Math.PI / 4)
      ctx.fillText(result.name, 0, 0)
      ctx.restore()

      // HMPI value on top of bar
      ctx.fillText(result.hmpi.toFixed(1), x + barWidth / 2 - 15, y - 5)
    })

    // Chart title
    ctx.fillStyle = textColor
    ctx.font = "bold 16px sans-serif"
    ctx.fillText("HMPI Values by Sample", canvas.width / 2 - 80, 30)

    this.updateChartLegend()
  }

  drawPieChart() {
    const canvas = this.chartCanvas
    const ctx = this.chartCtx

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) / 3

    const counts = {
      safe: this.results.filter((r) => r.category === "safe").length,
      moderate: this.results.filter((r) => r.category === "moderate").length,
      hazardous: this.results.filter((r) => r.category === "hazardous").length,
    }

    const total = this.results.length
    const colors = {
      safe: "#10b981",
      moderate: "#f59e0b",
      hazardous: "#ef4444",
    }

    let currentAngle = -Math.PI / 2

    Object.entries(counts).forEach(([category, count]) => {
      if (count === 0) return

      const sliceAngle = (count / total) * 2 * Math.PI

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.closePath()
      ctx.fillStyle = colors[category]
      ctx.fill()

      // Label
      const labelAngle = currentAngle + sliceAngle / 2
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7)
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7)

      ctx.fillStyle = "white"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(`${count}`, labelX, labelY)

      currentAngle += sliceAngle
    })

    // Title
    const textColor = this.isDarkMode ? "#f8fafc" : "#1e293b"
    ctx.fillStyle = textColor
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("HMPI Category Distribution", centerX, 30)

    this.updateChartLegend()
  }

  drawLineChart() {
    const canvas = this.chartCanvas
    const ctx = this.chartCtx

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (this.results.length < 2) {
      const textColor = this.isDarkMode ? "#f8fafc" : "#1e293b"
      ctx.fillStyle = textColor
      ctx.font = "16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Need at least 2 samples for trend analysis", canvas.width / 2, canvas.height / 2)
      return
    }

    const padding = 60
    const chartWidth = canvas.width - 2 * padding
    const chartHeight = canvas.height - 2 * padding

    const sortedResults = [...this.results].sort((a, b) => a.name.localeCompare(b.name))
    const maxHMPI = Math.max(...sortedResults.map((r) => r.hmpi))
    const minHMPI = Math.min(...sortedResults.map((r) => r.hmpi))
    const range = maxHMPI - minHMPI || 1

    const textColor = this.isDarkMode ? "#f8fafc" : "#1e293b"
    const gridColor = this.isDarkMode ? "#475569" : "#e2e8f0"

    // Draw grid
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1

    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + chartWidth, y)
      ctx.stroke()
    }

    // Draw line
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 3
    ctx.beginPath()

    sortedResults.forEach((result, index) => {
      const x = padding + (index / (sortedResults.length - 1)) * chartWidth
      const y = padding + chartHeight - ((result.hmpi - minHMPI) / range) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw points
    sortedResults.forEach((result, index) => {
      const x = padding + (index / (sortedResults.length - 1)) * chartWidth
      const y = padding + chartHeight - ((result.hmpi - minHMPI) / range) * chartHeight

      ctx.fillStyle = result.category === "safe" ? "#10b981" : result.category === "moderate" ? "#f59e0b" : "#ef4444"

      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()

      // Sample name
      ctx.fillStyle = textColor
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(result.name, x, padding + chartHeight + 20)
    })

    // Title
    ctx.fillStyle = textColor
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("HMPI Trend Analysis", canvas.width / 2, 30)

    this.updateChartLegend()
  }

  updateChartLegend() {
    const legend = document.getElementById("chartLegend")

    if (this.currentChart === "pie") {
      const counts = {
        safe: this.results.filter((r) => r.category === "safe").length,
        moderate: this.results.filter((r) => r.category === "moderate").length,
        hazardous: this.results.filter((r) => r.category === "hazardous").length,
      }

      legend.innerHTML = Object.entries(counts)
        .filter(([_, count]) => count > 0)
        .map(
          ([category, count]) => `
                    <div class="legend-item ${category}">
                        <span class="legend-color"></span>
                        ${category.charAt(0).toUpperCase() + category.slice(1)} (${count})
                    </div>
                `,
        )
        .join("")
    } else {
      legend.innerHTML = `
                <div class="legend-item safe">
                    <span class="legend-color"></span>
                    Safe (≤ 100)
                </div>
                <div class="legend-item moderate">
                    <span class="legend-color"></span>
                    Moderate (100-200)
                </div>
                <div class="legend-item hazardous">
                    <span class="legend-color"></span>
                    Hazardous (> 200)
                </div>
            `
    }
  }

  // Map Functionality
  initializeMap() {
    this.mapCanvas = document.getElementById("mapCanvas")
    this.mapCtx = this.mapCanvas.getContext("2d")
    this.mapTooltip = document.getElementById("mapTooltip")
    this.updateMap()
  }

  updateMap() {
    const canvas = this.mapCanvas
    const ctx = this.mapCtx

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const samplesWithCoords = this.results.filter((r) => r.latitude && r.longitude)

    if (samplesWithCoords.length === 0) {
      const textColor = this.isDarkMode ? "#f8fafc" : "#1e293b"
      ctx.fillStyle = textColor
      ctx.font = "16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("No location data available", canvas.width / 2, canvas.height / 2)
      return
    }

    // Calculate bounds
    const lats = samplesWithCoords.map((s) => s.latitude)
    const lngs = samplesWithCoords.map((s) => s.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const latRange = maxLat - minLat || 0.01
    const lngRange = maxLng - minLng || 0.01

    const padding = 50
    const mapWidth = canvas.width - 2 * padding
    const mapHeight = canvas.height - 2 * padding

    // Draw background
    ctx.fillStyle = this.isDarkMode ? "#334155" : "#f1f5f9"
    ctx.fillRect(padding, padding, mapWidth, mapHeight)

    // Draw border
    ctx.strokeStyle = this.isDarkMode ? "#475569" : "#e2e8f0"
    ctx.lineWidth = 2
    ctx.strokeRect(padding, padding, mapWidth, mapHeight)

    // Draw grid
    ctx.strokeStyle = this.isDarkMode ? "#475569" : "#e2e8f0"
    ctx.lineWidth = 1

    for (let i = 1; i < 5; i++) {
      const x = padding + (mapWidth / 5) * i
      const y = padding + (mapHeight / 5) * i

      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, padding + mapHeight)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + mapWidth, y)
      ctx.stroke()
    }

    // Draw sample points
    samplesWithCoords.forEach((result) => {
      const x = padding + ((result.longitude - minLng) / lngRange) * mapWidth
      const y = padding + mapHeight - ((result.latitude - minLat) / latRange) * mapHeight

      // Point color based on category
      const color = result.category === "safe" ? "#10b981" : result.category === "moderate" ? "#f59e0b" : "#ef4444"

      // Draw point
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, 2 * Math.PI)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = this.isDarkMode ? "#f8fafc" : "#1e293b"
      ctx.lineWidth = 2
      ctx.stroke()

      // Store point data for hover detection
      result._mapX = x
      result._mapY = y
    })

    // Draw coordinate labels
    const textColor = this.isDarkMode ? "#f8fafc" : "#1e293b"
    ctx.fillStyle = textColor
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"

    // Latitude labels
    for (let i = 0; i <= 4; i++) {
      const lat = minLat + (latRange / 4) * i
      const y = padding + mapHeight - (mapHeight / 4) * i
      ctx.fillText(lat.toFixed(3), 25, y + 4)
    }

    // Longitude labels
    for (let i = 0; i <= 4; i++) {
      const lng = minLng + (lngRange / 4) * i
      const x = padding + (mapWidth / 4) * i
      ctx.fillText(lng.toFixed(3), x, canvas.height - 10)
    }

    // Title
    ctx.font = "bold 16px sans-serif"
    ctx.fillText("Sample Locations", canvas.width / 2, 30)
  }

  handleMapHover(e) {
    const rect = this.mapCanvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const samplesWithCoords = this.results.filter((r) => r.latitude && r.longitude && r._mapX && r._mapY)

    for (const result of samplesWithCoords) {
      const distance = Math.sqrt(Math.pow(mouseX - result._mapX, 2) + Math.pow(mouseY - result._mapY, 2))

      if (distance <= 12) {
        this.showMapTooltip(e, result)
        return
      }
    }

    this.hideMapTooltip()
  }

  showMapTooltip(e, result) {
    const tooltip = this.mapTooltip

    tooltip.innerHTML = `
            <strong>${result.name}</strong><br>
            HMPI: ${result.hmpi.toFixed(2)}<br>
            Category: ${result.category}<br>
            Location: ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}
        `

    tooltip.style.left = e.pageX + 10 + "px"
    tooltip.style.top = e.pageY - 10 + "px"
    tooltip.style.opacity = "1"
  }

  hideMapTooltip() {
    this.mapTooltip.style.opacity = "0"
  }

  // Modal Management
  showModal(modalId) {
    document.getElementById(modalId).classList.add("show")
  }

  closeModal(modal) {
    modal.classList.remove("show")
  }

  showMetalInfo(metal) {
    const info = this.metalInfo[metal]
    if (!info) return

    const modal = document.getElementById("metalInfoModal")
    const title = document.getElementById("metalInfoTitle")
    const body = document.getElementById("metalInfoBody")

    title.textContent = `${info.name} (${metal.toUpperCase()})`

    body.innerHTML = `
            <h4>Health Effects</h4>
            <p>${info.effects}</p>
            
            <h4>Common Sources</h4>
            <p>${info.sources}</p>
            
            <h4>WHO Guideline</h4>
            <p>${info.limit}</p>
            
            <h4>Additional Information</h4>
            <p>This metal is monitored in groundwater due to its potential health impacts. Regular testing helps ensure water safety for consumption and other uses.</p>
        `

    this.showModal("metalInfoModal")
  }

  showError(message) {
    const modal = document.getElementById("errorModal")
    const body = document.getElementById("errorModalBody")

    body.innerHTML = `<p>${message}</p>`
    this.showModal("errorModal")
  }
}

// Initialize the application
const hmpiCalc = new HMPICalculator()

// Make functions globally available for onclick handlers
window.hmpiCalc = hmpiCalc
