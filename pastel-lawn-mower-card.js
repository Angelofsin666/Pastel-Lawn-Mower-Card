// ============================================================================
// Pastel Lawn Mower Card — custom Lovelace card for Home Assistant / HACS
// ============================================================================

const { LitElement, html, css } = await import(
  "https://unpkg.com/lit-element@2/lit-element.js?module"
);

// ----------------------------------------------------------------------------
// Color palette (same set as the other Pastel cards, for consistency)
// ----------------------------------------------------------------------------
const PALETTE = {
  amber:  { base: "#f59e0b", light: "#fde68a", bg: "#fef3c7", text: "#d97706" },
  blue:   { base: "#3d9cf0", light: "#b8dafc", bg: "#e8f3fe", text: "#3d9cf0" },
  green:  { base: "#34c472", light: "#bdeed4", bg: "#e6f9ef", text: "#1f9d5c" },
  pink:   { base: "#ec4899", light: "#fbcfe8", bg: "#fce7f3", text: "#db2777" },
  purple: { base: "#9b5de5", light: "#ddd1f7", bg: "#f3ecff", text: "#8b3fd9" },
  red:    { base: "#f05252", light: "#fac9c9", bg: "#fee8e8", text: "#e03c3c" },
  teal:   { base: "#20c997", light: "#a8e8d3", bg: "#e6faf4", text: "#159b76" },
  orange: { base: "#f0943d", light: "#fcd9b0", bg: "#fef3e8", text: "#d9762a" },
};
const PALETTE_KEYS = Object.keys(PALETTE);

function getColors(key) {
  return PALETTE[key] || PALETTE.green;
}

function isValidNumber(value) {
  if (value === undefined || value === null) return false;
  if (value === "unknown" || value === "unavailable") return false;
  const n = Number(value);
  return !Number.isNaN(n);
}

// ----------------------------------------------------------------------------
// Native lawn_mower activity → Italian label, per Home Assistant's
// documented LawnMowerActivity states (mowing/docked/paused/returning/error).
// ----------------------------------------------------------------------------
const ACTIVITY_LABELS = {
  mowing: "In funzione",
  docked: "Alla base",
  paused: "In pausa",
  returning: "Ritorno alla base",
  error: "Errore",
  unavailable: "Non disponibile",
  unknown: "Sconosciuto",
};

function activityLabel(state) {
  return ACTIVITY_LABELS[state] || state || "Sconosciuto";
}

// ----------------------------------------------------------------------------
// Default illustration shipped with this card (HACS asset, see README).
// Configurable per-card via `image_url` for reuse with a different mower.
// ----------------------------------------------------------------------------
const DEFAULT_IMAGE_URL = "/hacsfiles/pastel-lawn-mower-card/lawn-mower-romario.png";

// ----------------------------------------------------------------------------
// Card
// ----------------------------------------------------------------------------
class PastelLawnMowerCard extends LitElement {

  static get properties() {
    return { hass: {}, config: {} };
  }

  static getStubConfig() {
    return {
      title: "Robot tagliaerba",
      subtitle: "Robot tagliaerba",
      icon: "mdi:robot-mower",
      color: "green",
      image_url: DEFAULT_IMAGE_URL,
      mower_entity: "",
      battery_entity: "",
      area_entity: "",
      time_remaining_entity: "",
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Configurazione non valida");
    if (!config.mower_entity) {
      throw new Error("Devi specificare mower_entity (entità lawn_mower.*)");
    }
    this.config = {
      title: config.title || "Robot tagliaerba",
      subtitle: config.subtitle || "",
      icon: config.icon || "mdi:robot-mower",
      color: PALETTE_KEYS.includes(config.color) ? config.color : "green",
      image_url: config.image_url || DEFAULT_IMAGE_URL,
      mower_entity: config.mower_entity,
      battery_entity: config.battery_entity || "",
      area_entity: config.area_entity || "",
      time_remaining_entity: config.time_remaining_entity || "",
    };
  }

  getCardSize() {
    return 5;
  }

  static getConfigElement() {
    return document.createElement("pastel-lawn-mower-card-editor");
  }

  // -- helpers ---------------------------------------------------------------

  _activity() {
    if (!this.hass) return "unknown";
    const stateObj = this.hass.states[this.config.mower_entity];
    return stateObj ? stateObj.state : "unavailable";
  }

  _sensorValue(entityId) {
    if (!entityId || !this.hass) return null;
    const stateObj = this.hass.states[entityId];
    if (!stateObj) return null;
    const raw = stateObj.state;
    return isValidNumber(raw) ? Number(raw) : null;
  }

  _callService(service, ev) {
    if (ev) ev.stopPropagation();
    this.hass.callService("lawn_mower", service, {
      entity_id: this.config.mower_entity,
    });
  }

  _showMoreInfo(id, ev) {
    if (ev) ev.stopPropagation();
    if (!id) return;
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId: id };
    this.dispatchEvent(event);
  }

  // -- render --------------------------------------------------------------

  render() {
    if (!this.config || !this.hass) return html``;

    const colors = getColors(this.config.color);
    const activity = this._activity();
    const label = activityLabel(activity);

    const battery = this._sensorValue(this.config.battery_entity);
    const area = this._sensorValue(this.config.area_entity);
    const timeRemaining = this._sensorValue(this.config.time_remaining_entity);

    const pauseDisabled = activity !== "mowing";
    const dockDisabled = activity === "docked" || activity === "returning";

    return html`
      <ha-card style="--c-base:${colors.base}; --c-light:${colors.light}; --c-bg:${colors.bg}; --c-text:${colors.text};">

        <div class="header">
          <div class="header-left">
            <ha-icon icon=${this.config.icon} style="color:${colors.base}"></ha-icon>
            <div class="header-text">
              <div class="title">${this.config.title}</div>
              <div class="subtitle">${this.config.subtitle}</div>
            </div>
          </div>
          <span class="badge" @click=${(e) => this._showMoreInfo(this.config.mower_entity, e)}>
            <span class="badge-dot"></span>
            ${label}
          </span>
        </div>

        <div class="content-row">
          <div class="illustration" @click=${(e) => this._showMoreInfo(this.config.mower_entity, e)}>
            <img src=${this.config.image_url} alt="" class="mower-image" />
          </div>

          <div class="stats">
            ${battery !== null ? html`
              <div class="stat-block" @click=${(e) => this._showMoreInfo(this.config.battery_entity, e)}>
                <div class="stat-label">Batteria</div>
                <div class="stat-value">${battery.toFixed(0)}<span class="stat-unit">%</span></div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${Math.min(100, Math.max(0, battery))}%"></div>
                </div>
              </div>
            ` : ""}

            ${area !== null ? html`
              <div class="stat-block-small" @click=${(e) => this._showMoreInfo(this.config.area_entity, e)}>
                <span class="stat-value-small">${area.toFixed(0)}</span>
                <span class="stat-unit-small">m²</span>
              </div>
            ` : ""}

            ${timeRemaining !== null ? html`
              <div class="stat-block-small" @click=${(e) => this._showMoreInfo(this.config.time_remaining_entity, e)}>
                <span class="stat-value-small">${formatHM(timeRemaining)}</span>
                <span class="stat-unit-small">h:min</span>
              </div>
            ` : ""}
          </div>
        </div>

        <div class="actions">
          <button
            class="action-button ${pauseDisabled ? "disabled" : ""}"
            ?disabled=${pauseDisabled}
            @click=${(e) => !pauseDisabled && this._callService("pause", e)}
          >
            <ha-icon icon="mdi:pause"></ha-icon>
            Pausa
          </button>
          <button
            class="action-button ${dockDisabled ? "disabled" : ""}"
            ?disabled=${dockDisabled}
            @click=${(e) => !dockDisabled && this._callService("dock", e)}
          >
            <ha-icon icon="mdi:home-import-outline"></ha-icon>
            Ricarica
          </button>
        </div>

      </ha-card>
    `;
  }

  static get styles() {
    return css`
      :host { display: block; }
      ha-card {
        border-radius: 28px;
        background: var(--ha-card-background, #ffffff);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.08);
        padding: 4px;
        overflow: hidden;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px 8px;
      }
      .header-left { display: flex; align-items: center; gap: 10px; }
      .header ha-icon { --mdc-icon-size: 20px; }
      .title { font-size: 17px; font-weight: 600; color: var(--primary-text-color); }
      .subtitle { font-size: 11px; color: var(--c-text); margin-top: 1px; }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 11px;
        border-radius: 12px;
        background: var(--c-bg);
        color: var(--c-text);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
      }
      .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-text); }
      .content-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 4px;
        background: var(--c-bg);
        border-radius: 20px;
        padding: 12px;
      }
      .illustration {
        flex-shrink: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        width: 140px;
      }
      .mower-image {
        width: 100%;
        height: auto;
        display: block;
      }
      .stats {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }
      .stat-block { cursor: pointer; }
      .stat-label { font-size: 11px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.04em; }
      .stat-value { font-size: 32px; font-weight: 300; color: var(--c-text); line-height: 1; margin-top: 2px; }
      .stat-unit { font-size: 16px; }
      .progress-track {
        margin-top: 6px; height: 6px; border-radius: 3px;
        background: var(--c-light); overflow: hidden;
      }
      .progress-fill { height: 100%; background: var(--c-base); transition: width 0.3s ease; }
      .stat-block-small {
        display: flex;
        align-items: baseline;
        gap: 4px;
        cursor: pointer;
      }
      .stat-value-small { font-size: 16px; font-weight: 600; color: var(--primary-text-color); }
      .stat-unit-small { font-size: 11px; color: var(--secondary-text-color); }
      .actions {
        display: flex;
        gap: 6px;
        padding: 4px;
      }
      .action-button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 12px 0;
        border-radius: 16px;
        border: none;
        background: var(--c-bg);
        color: var(--c-text);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
      }
      .action-button ha-icon { --mdc-icon-size: 18px; }
      .action-button:active:not(.disabled) { filter: brightness(0.95); }
      .action-button.disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    `;
  }
}

function formatHM(minutesTotal) {
  const h = Math.floor(minutesTotal / 60);
  const m = Math.round(minutesTotal % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

customElements.define("pastel-lawn-mower-card", PastelLawnMowerCard);

// ============================================================================
// Visual editor
// ============================================================================
class PastelLawnMowerCardEditor extends LitElement {

  static get properties() {
    return { hass: {}, _config: { state: true } };
  }

  setConfig(config) {
    this._config = { ...config };
  }

  _valueChanged(field, value) {
    this._config = { ...this._config, [field]: value };
    this._fireChanged();
  }

  _fireChanged() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this._config || !this.hass) return html``;

    const baseSchema = [
      { name: "title", selector: { text: {} } },
      { name: "subtitle", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      { name: "image_url", selector: { text: {} } },
    ];

    const baseData = {
      title: this._config.title || "",
      subtitle: this._config.subtitle || "",
      icon: this._config.icon || "mdi:robot-mower",
      image_url: this._config.image_url || "",
    };

    return html`
      <div class="editor">

        <ha-form
          .hass=${this.hass}
          .data=${baseData}
          .schema=${baseSchema}
          .computeLabel=${(s) => this._labelFor(s.name)}
          @value-changed=${(ev) => {
            this._config = { ...this._config, ...ev.detail.value };
            this._fireChanged();
          }}
        ></ha-form>

        <div class="color-section">
          <div class="section-label">Colore della card</div>
          <div class="color-row">
            ${PALETTE_KEYS.map((key) => html`
              <button
                class="swatch ${this._config.color === key ? "selected" : ""}"
                style="background:${PALETTE[key].base}"
                title=${key}
                @click=${() => this._valueChanged("color", key)}
              ></button>
            `)}
          </div>
        </div>

        <div class="entities-section">
          <div class="section-label">Entità</div>

          <ha-entity-picker
            .hass=${this.hass}
            .value=${this._config.mower_entity || ""}
            .includeDomains=${["lawn_mower"]}
            label="Entità robot tagliaerba (obbligatoria)"
            @value-changed=${(ev) => this._valueChanged("mower_entity", ev.detail.value)}
          ></ha-entity-picker>

          <ha-entity-picker
            .hass=${this.hass}
            .value=${this._config.battery_entity || ""}
            .includeDomains=${["sensor"]}
            label="Entità batteria % (opzionale)"
            @value-changed=${(ev) => this._valueChanged("battery_entity", ev.detail.value)}
          ></ha-entity-picker>

          <ha-entity-picker
            .hass=${this.hass}
            .value=${this._config.area_entity || ""}
            .includeDomains=${["sensor"]}
            label="Entità area m² (opzionale)"
            @value-changed=${(ev) => this._valueChanged("area_entity", ev.detail.value)}
          ></ha-entity-picker>

          <ha-entity-picker
            .hass=${this.hass}
            .value=${this._config.time_remaining_entity || ""}
            .includeDomains=${["sensor"]}
            label="Entità tempo rimanente in minuti (opzionale)"
            @value-changed=${(ev) => this._valueChanged("time_remaining_entity", ev.detail.value)}
          ></ha-entity-picker>
        </div>

        <div class="hint">
          I bottoni Pausa e Ricarica chiamano i servizi standard
          <code>lawn_mower.pause</code> e <code>lawn_mower.dock</code>
          sull'entità robot tagliaerba selezionata sopra — non serve
          configurare altro. Si disabilitano automaticamente quando l'azione
          non avrebbe senso nello stato attuale (es. Ricarica se già alla
          base).
        </div>

      </div>
    `;
  }

  _labelFor(name) {
    const labels = { title: "Titolo", subtitle: "Sottotitolo", icon: "Icona", image_url: "URL immagine (lascia vuoto per il disegno di default)" };
    return labels[name] || name;
  }

  static get styles() {
    return css`
      .editor { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
      .section-label { font-size: 14px; color: var(--primary-text-color); margin-bottom: 8px; font-weight: 500; }
      .color-row { display: flex; gap: 10px; flex-wrap: wrap; }
      .swatch {
        width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent;
        cursor: pointer; padding: 0; transition: transform 0.15s ease, border-color 0.15s ease;
      }
      .swatch:hover { transform: scale(1.1); }
      .swatch.selected { border-color: var(--primary-text-color); box-shadow: 0 0 0 2px var(--card-background-color, #fff); }
      .entities-section { display: flex; flex-direction: column; gap: 10px; }
      .hint { font-size: 12px; color: var(--secondary-text-color); }
      .hint code { background: var(--secondary-background-color, #f4f4f4); padding: 1px 4px; border-radius: 4px; }
    `;
  }
}

customElements.define("pastel-lawn-mower-card-editor", PastelLawnMowerCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "pastel-lawn-mower-card",
  name: "Pastel Lawn Mower Card",
  description: "Card robot tagliaerba con illustrazione statica, stato nativo lawn_mower, batteria/area/tempo, bottoni Pausa e Ricarica, colore personalizzabile.",
  preview: true,
});
