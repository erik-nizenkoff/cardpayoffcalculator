    (function () {
      "use strict";

      var MAX_CARDS = 20;
      var MAX_PAYOFF_OPTIONS = 8;
      var MAX_MONTHS = 600;
      var MAX_APR = 79.99;
      var MIN_INTRO_MONTHS = 1;
      var MAX_INTRO_MONTHS = 120;
      var EPSILON = 0.005;
      var SUPABASE_URL = 'https://ofhgwcbcljlmvuqvwoax.supabase.co';
      var SUPABASE_ANON_KEY = 'sb_publishable_TshGB0Mpxe2zjVOc9zeW_w_LzEi5j_S';
      var PAYOFF_OPTION_TELEMETRY_ENABLED = true;
      var DEFAULT_EMPTY_MESSAGE = "Enter at least one card or loan with a balance, rate, and payment to see live results.";
      var ZERO_BALANCE_MESSAGE = "All entered balances are $0. You do not have any active debt to model.";

      var cardRows = document.getElementById("cardRows");
      // ── DOM refs ──────────────────────────────────────────────────────────
      var calculatorForm = document.getElementById("calculatorForm");
      var addCardButton = document.getElementById("addCardButton");
      var addLoanButton = document.getElementById("addLoanButton");
      var loanRows = document.getElementById("loanRows");
      var sampleButton = document.getElementById("sampleButton");
      var clearAllButton = document.getElementById("clearAllButton");
      var loadExampleButton = document.getElementById("loadExampleButton");
      var formError = document.getElementById("formError");
      var methodInput = document.getElementById("method");
      var paymentModeInput = document.getElementById("paymentMode");
      var extraInput = document.getElementById("extraPayment");
      var paymentAmountLabel = document.getElementById("paymentAmountLabel");
      var paymentInputHint = document.getElementById("paymentInputHint");
      var startInput = document.getElementById("startMonth");
      var targetInput = document.getElementById("targetMonth");
      var telemetryOptOut = document.getElementById("telemetryOptOut");
      var resultsPanel = document.getElementById("resultsPanel");
      var emptyResults = document.getElementById("emptyResults");
      var resultsContent = document.getElementById("resultsContent");
      var sampleResultBadge = document.getElementById("sampleResultBadge");
      var sampleResultActions = document.getElementById("sampleResultActions");
      var sampleHeroBadge = document.getElementById("sampleHeroBadge");
      var sampleShareNote = document.getElementById("sampleShareNote");
      var sampleChartBadge = document.getElementById("sampleChartBadge");
      var totalBalanceEl = document.getElementById("totalBalance");
      var totalMinimumsEl = document.getElementById("totalMinimums");
      var payoffDateEl = document.getElementById("payoffDate");
      var payoffSuggestion = document.getElementById("payoffSuggestion");
      var currentPlanSummary = document.getElementById("currentPlanSummary");
      var payoffMonthsEl = document.getElementById("payoffMonths");
      var totalInterestLabel = document.getElementById("totalInterestLabel");
      var totalInterestEl = document.getElementById("totalInterest");
      var monthlyPaymentEl = document.getElementById("monthlyPayment");
      var totalPaidLabel = document.getElementById("totalPaidLabel");
      var totalPaidEl = document.getElementById("totalPaid");
      var firstTargetEl = document.getElementById("firstTarget");
      var targetResult = document.getElementById("targetResult");
      var targetInlineResult = document.getElementById("targetInlineResult");
      var savingsResult = document.getElementById("savingsResult");
      var methodRecommendation = document.getElementById("methodRecommendation");
      var resultExplainer = document.getElementById("resultExplainer");
      var payoffOptions = document.getElementById("payoffOptions");
      var optionScenarioList = document.getElementById("optionScenarioList");
      var optionCapacityNotice = document.getElementById("optionCapacityNotice");
      var optionUsageSummary = document.getElementById("optionUsageSummary");
      var payoffOptionRows = document.getElementById("payoffOptionRows");
      var payoffOptionNote = document.getElementById("payoffOptionNote");
      var criticalWarningsEl = document.getElementById("criticalWarnings");
      var warningsEl = document.getElementById("warnings");
      var monthPlan = document.getElementById("monthPlan");
      var monthPlanRows = document.getElementById("monthPlanRows");
      var comparisonRows = document.getElementById("comparisonRows");
      var comparisonSection = document.getElementById("comparisonSection");
      var decisionSnapshot = document.getElementById("decisionSnapshot");
      var decisionRows = document.getElementById("decisionRows");
      var scheduleRows = document.getElementById("scheduleRows");
      var scheduleNote = document.getElementById("scheduleNote");
      var toggleSchedule = document.getElementById("toggleSchedule");
      var scheduleLoading = document.getElementById("scheduleLoading");
      var firstRunHint = document.getElementById("firstRunHint");
      var sampleDataBanner = document.getElementById("sampleDataBanner");
      var planModeStatus = document.getElementById("planModeStatus");
      var enterCardsButton = document.getElementById("enterCardsButton");
      var resultEnterCardsButton = document.getElementById("resultEnterCardsButton");
      var sampleEnterCardsButton = document.getElementById("sampleEnterCardsButton");
      var keepSampleButton = document.getElementById("keepSampleButton");
      var dismissHint = document.getElementById("dismissHint");
      var boostExtraButton = document.getElementById("boostExtraButton");
      var methodDescription = document.getElementById("methodDescription");
      var customOrderPanel = document.getElementById("customOrderPanel");
      var customOrderList = document.getElementById("customOrderList");
      var printButton = document.getElementById("printButton");
      var copyLinkButton = document.getElementById("copyLinkButton");
      var copySummaryButton = document.getElementById("copySummaryButton");
      var copySummaryStatus = document.getElementById("copySummaryStatus");
      var copyActionsHelp = document.getElementById("copyActionsHelp");
      var mobileSummaryBar = document.getElementById("mobileSummaryBar");
      var mobilePayoffDate = document.getElementById("mobilePayoffDate");
      var mobileSampleBadge = document.getElementById("mobileSampleBadge");
      var mobileTotalInterest = document.getElementById("mobileTotalInterest");
      var mobileMonthlyPayment = document.getElementById("mobileMonthlyPayment");
      var mobileSummaryLink = document.getElementById("mobileSummaryLink");
      var mobilePayoffJump = document.getElementById("mobilePayoffJump");
      var reportIssueButton = document.getElementById("reportIssueButton");
      var aboutReportIssueButton = document.getElementById("aboutReportIssueButton");
      var feedbackDialog = document.getElementById("feedbackDialog");
      var feedbackForm = document.getElementById("feedbackForm");
      var feedbackType = document.getElementById("feedbackType");
      var feedbackMessage = document.getElementById("feedbackMessage");
      var feedbackEmail = document.getElementById("feedbackEmail");
      var feedbackStatus = document.getElementById("feedbackStatus");
      var feedbackSubmitButton = document.getElementById("feedbackSubmitButton");
      var feedbackCancelButton = document.getElementById("feedbackCancelButton");
      var feedbackCancelSecondaryButton = document.getElementById("feedbackCancelSecondaryButton");

      var requiredElements = [
        cardRows, calculatorForm, addCardButton, addLoanButton, loanRows, sampleButton,
        clearAllButton, formError, methodInput, paymentModeInput, extraInput, paymentAmountLabel, paymentInputHint, startInput,
        targetInput, telemetryOptOut, resultsPanel, emptyResults, resultsContent, sampleResultBadge, sampleResultActions, sampleHeroBadge, sampleShareNote, sampleChartBadge, totalBalanceEl, totalMinimumsEl,
        payoffDateEl, payoffSuggestion, currentPlanSummary, payoffMonthsEl, totalInterestLabel, totalInterestEl, monthlyPaymentEl,
        totalPaidLabel, totalPaidEl, firstTargetEl, targetResult, targetInlineResult, savingsResult, methodRecommendation,
        resultExplainer, payoffOptions, optionScenarioList, optionCapacityNotice, optionUsageSummary, payoffOptionRows, payoffOptionNote,
        criticalWarningsEl, warningsEl, monthPlan, monthPlanRows,
        comparisonRows, comparisonSection, decisionSnapshot, decisionRows, scheduleRows, scheduleNote, toggleSchedule,
        scheduleLoading, firstRunHint, sampleDataBanner, planModeStatus, enterCardsButton, resultEnterCardsButton, sampleEnterCardsButton, keepSampleButton, dismissHint, boostExtraButton, methodDescription, customOrderPanel,
        customOrderList, printButton, copyLinkButton, copySummaryButton, copySummaryStatus, copyActionsHelp,
        mobileSummaryBar, mobilePayoffDate, mobileSampleBadge, mobileTotalInterest, mobileMonthlyPayment, mobileSummaryLink, mobilePayoffJump,
        reportIssueButton, feedbackDialog, feedbackForm, feedbackType, feedbackMessage, feedbackEmail, feedbackStatus, feedbackSubmitButton,
        feedbackCancelButton, feedbackCancelSecondaryButton
      ];

      if (requiredElements.some(function (element) { return !element; })) {
        return;
      }

      var nextId = 1;
      var loanNextId = 1;
      var optionScenarioNextId = 1;
      var showAllSchedule = false;
      var isSampleMode = false;
      var scheduleRenderGeneration = 0;
      var updateTimer = null;
      var printPreviousShowAll = false;
      var printSchedulePrepared = false;
      var lastResult = null;
      var copyStatusTimer = null;
      var lastCards = [];
      var lastLoans = [];
      var customOrder = [];

      var moneyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      });

      var moneyCentsFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      var monthFormatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC"
      });

      function roundCents(value) {
        return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
      }

      function money(value) {
        return moneyFormatter.format(Math.round(Number(value || 0)));
      }

      function moneyCents(value) {
        return moneyCentsFormatter.format(roundCents(value));
      }

      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
          return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
          }[char];
        });
      }

      function getUid() {
        var uid = localStorage.getItem('cpoc_uid');
        if (!uid) {
          uid = 'u_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
          localStorage.setItem('cpoc_uid', uid);
        }
        return uid;
      }

      function currentMonthValue() {
        var now = new Date();
        return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      }

      function bind(element, type, handler, options) {
        if (element) element.addEventListener(type, handler, options);
      }

      function scheduleIdle(callback) {
        var idle = window.requestIdleCallback || function (handler) {
          return setTimeout(handler, 1);
        };
        return idle(callback);
      }

      function enhanceScrollableTables(root) {
        (root || document).querySelectorAll(".table-scroll").forEach(function (region, index) {
          region.setAttribute("tabindex", "0");
          if (!region.hasAttribute("role")) {
            region.setAttribute("role", "region");
          }
          if (!region.hasAttribute("aria-label")) {
            region.setAttribute("aria-label", "Scrollable table " + (index + 1));
          }
        });
      }

      function bindLoadExampleButton() {
        loadExampleButton = document.getElementById("loadExampleButton");
        bind(loadExampleButton, "click", function () {
          loadSample();
          if (calculatorForm) calculatorForm.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }

      function bindDeferredFeedbackLauncher() {
        aboutReportIssueButton = document.getElementById("aboutReportIssueButton");
        bind(aboutReportIssueButton, "click", openFeedbackDialog);
      }

      function mountDeferredContent() {
        var mount = document.getElementById("deferredContentMount");
        var template = document.getElementById("deferredContentTemplate");
        if (!mount || !template || mount.dataset.mounted === "true") return;
        mount.appendChild(template.content.cloneNode(true));
        mount.dataset.mounted = "true";
        enhanceScrollableTables(mount);
        bindLoadExampleButton();
        bindDeferredFeedbackLauncher();
        if (window.location.hash && mount.querySelector(window.location.hash)) {
          mount.querySelector(window.location.hash).scrollIntoView();
        }
      }

      function telemetryDisabled() {
        try {
          return window.CP_TELEMETRY_DISABLED === true ||
            localStorage.getItem(window.CP_TELEMETRY_KEY || "cpoc_telemetry_opt_out") === "1" ||
            navigator.doNotTrack === "1" ||
            window.doNotTrack === "1";
        } catch (error) {
          return window.CP_TELEMETRY_DISABLED === true ||
            navigator.doNotTrack === "1" ||
            window.doNotTrack === "1";
        }
      }

      function setTelemetryOptOut(enabled) {
        window.CP_TELEMETRY_DISABLED = Boolean(enabled);
        try {
          if (enabled) {
            localStorage.setItem(window.CP_TELEMETRY_KEY || "cpoc_telemetry_opt_out", "1");
          } else {
            localStorage.removeItem(window.CP_TELEMETRY_KEY || "cpoc_telemetry_opt_out");
          }
        } catch (error) {}
      }

      function syncTelemetryOptOutControl() {
        if (!telemetryOptOut) return;
        telemetryOptOut.checked = telemetryDisabled();
      }

      function syncPaymentInputCopy() {
        var totalMode = paymentModeInput && paymentModeInput.value === "total";
        if (paymentAmountLabel) {
          paymentAmountLabel.textContent = totalMode ? "Total Monthly Debt Payoff Budget ($)" : "Extra Monthly Payment ($)";
        }
        if (extraInput) {
          extraInput.setAttribute("aria-label", totalMode ? "Total monthly debt payoff budget" : "Extra monthly payment");
        }
        if (paymentInputHint) {
          paymentInputHint.textContent = totalMode
            ? "This is your full monthly payoff budget, including all required minimum or fixed payments."
            : "Applied after all active debts receive their required minimum or fixed payment.";
        }
      }

      function paymentMode() {
        return paymentModeInput && paymentModeInput.value === "total" ? "total" : "extra";
      }

      enhanceScrollableTables(document);

      function addMonths(monthValue, offset) {
        var parts = String(monthValue || currentMonthValue()).split("-").map(Number);
        var date = new Date(Date.UTC(parts[0], parts[1] - 1 + offset, 1));
        return monthFormatter.format(date);
      }

      function chartAxisMonthLabel(pointIndex, startMonth) {
        var point = Math.max(0, Number(pointIndex || 0));
        return addMonths(startMonth || startInput.value, point === 0 ? 0 : point - 1);
      }

      function resultMonthLabel(monthNumber) {
        return addMonths(startInput.value, Math.max(0, Number(monthNumber || 1) - 1));
      }

      function monthsBetweenInclusive(startMonth, targetMonth) {
        if (!startMonth || !targetMonth) return null;
        var start = startMonth.split("-").map(Number);
        var target = targetMonth.split("-").map(Number);
        if (!start[0] || !start[1] || !target[0] || !target[1]) return null;
        var monthDelta = (target[0] - start[0]) * 12 + (target[1] - start[1]);
        return monthDelta > 0 ? monthDelta + 1 : null;
      }

      function duration(months, capped) {
        if (capped) return "50+ years";
        if (!months) return "0 months";
        var years = Math.floor(months / 12);
        var rest = months % 12;
        if (!years) return months + " month" + (months === 1 ? "" : "s");
        if (!rest) return years + " year" + (years === 1 ? "" : "s");
        return years + " yr " + rest + " mo";
      }

      function methodLabel(method) {
        return {
          avalanche: "Avalanche",
          snowball: "Snowball",
          minimum: "Pay minimums only",
          custom: "Custom order"
        }[method] || "Avalanche";
      }

      function methodHelp(method) {
        return {
          avalanche: "Here's what it takes to get debt-free. Avalanche is the default because it usually lowers total interest.",
          snowball: "Here's what it takes to get debt-free. Snowball focuses on small balances first for faster early wins.",
          minimum: "Here's what it takes to get debt-free. Pay minimums only means no extra payment.",
          custom: "Here's what it takes to get debt-free. Custom order follows the target list you choose."
        }[method] || "Here's what it takes to get debt-free. Avalanche is the default because it usually lowers total interest.";
      }

      function setFieldLabel(row, field, label) {
        var input = row.querySelector('[data-field="' + field + '"]');
        if (input) input.setAttribute("aria-label", label);
      }

      function fieldErrorId(row, field) {
        return (row.dataset.id || "row") + "-" + field + "-error";
      }

      function clearFieldErrors() {
        document.querySelectorAll("[aria-invalid='true']").forEach(function (input) {
          input.removeAttribute("aria-invalid");
          input.removeAttribute("aria-describedby");
        });
        document.querySelectorAll(".field-error").forEach(function (error) {
          error.textContent = "";
          error.classList.add("hidden");
        });
      }

      function setFieldError(row, field, message) {
        if (!row) return;
        var input = row.querySelector('[data-field="' + field + '"]');
        var error = row.querySelector('[data-error-for="' + field + '"]');
        if (!input || !error) return;
        var id = fieldErrorId(row, field);
        error.id = id;
        error.textContent = message;
        error.classList.remove("hidden");
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", id);
      }

      function setControlError(input, field, message) {
        if (!input) return;
        var parent = input.closest(".field-stack") || input.parentElement;
        var error = parent ? parent.querySelector('[data-error-for="' + field + '"]') : null;
        if (!error) return;
        var id = input.id ? input.id + "-error" : field + "-error";
        error.id = id;
        error.textContent = message;
        error.classList.remove("hidden");
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", id);
      }

      function updateCardSummary(row) {
        var name = getField(row, "name") || "Card";
        var balance = Number(getField(row, "balance"));
        var apr = Number(getField(row, "apr"));
        var minimum = Number(getField(row, "minimum"));
        var summary = row.querySelector(".card-summary-text");
        var toggle = row.querySelector(".card-summary-line");
        var hint = row.querySelector(".row-expand-hint");
        var expanded = row.classList.contains("expanded");
        if (summary) {
          summary.innerHTML = '<span class="card-summary-title">' + escapeHtml(name) + '</span>' +
            '<span class="card-summary-meta">Balance ' + money(balance) + ' · APR ' + (Number.isFinite(apr) ? apr.toFixed(2).replace(/\.00$/, "") : "0") + '% · Minimum ' + money(minimum) + '</span>';
        }
        if (hint) hint.textContent = expanded ? "Done" : "Tap to edit";
        if (toggle) {
          var summaryLabel = name + ", Balance " + money(balance) + ", APR " + (Number.isFinite(apr) ? apr.toFixed(2).replace(/\.00$/, "") : "0") + "%, Minimum " + money(minimum);
          toggle.setAttribute("aria-expanded", String(expanded));
          toggle.setAttribute("aria-label", summaryLabel + ", " + (expanded ? "Done, Collapse card details" : "Tap to edit, Expand card details"));
        }
        setFieldLabel(row, "name", name + " card name");
        setFieldLabel(row, "balance", name + " balance");
        setFieldLabel(row, "apr", name + " APR");
        setFieldLabel(row, "minimum", name + " minimum payment");
        setFieldLabel(row, "introApr", name + " intro APR");
        setFieldLabel(row, "introMonths", name + " intro promotional months");
      }

      function addCardRow(card, options) {
        if (cardRows.children.length >= MAX_CARDS) return;
        var data = card || {};
        var settings = options || {};
        var id = data.id || "card-" + nextId++;
        var idMatch = /^card-(\d+)$/.exec(id);
        if (idMatch) nextId = Math.max(nextId, Number(idMatch[1]) + 1);
        var tr = document.createElement("tr");
        tr.className = "mobile-card-row";
        if (settings.expandOnMobile) tr.classList.add("expanded");
        tr.dataset.id = id;
        tr.innerHTML =
          '<td class="card-summary-cell" colspan="5"><button type="button" class="card-summary-line" data-action="toggle-card-row" aria-label="Expand card details" aria-expanded="false"><span class="card-summary-text"></span><span class="row-expand-hint">Tap to edit</span><span class="row-chevron">›</span></button></td>' +
          '<td class="name-cell card-row-detail" data-label="Card nickname"><input data-field="name" aria-label="Card nickname" value="' + escapeHtml(data.name || "") + '" placeholder="Visa"></td>' +
          '<td class="amount-cell card-row-detail" data-label="Balance ($)"><input data-field="balance" aria-label="Balance" type="number" min="0" step="0.01" inputmode="decimal" value="' + (data.balance != null ? data.balance : "") + '" placeholder="8,500"><span class="field-error hidden" data-error-for="balance"></span></td>' +
          '<td class="amount-cell apr-cell card-row-detail" data-label="APR (%)"><input data-field="apr" aria-label="APR, no percent sign needed" type="number" min="0" max="79.99" step="0.01" inputmode="decimal" value="' + (data.apr != null ? data.apr : "") + '" placeholder="22.99"><span class="field-error hidden" data-error-for="apr"></span><button type="button" class="inline-link" data-action="toggle-intro" aria-expanded="false">Add promo APR</button>' +
          '<div class="intro-fields hidden"><label>Intro APR (%)<input data-field="introApr" aria-label="Intro APR, no percent sign needed" type="number" min="0" max="79.99" step="0.01" inputmode="decimal" value="' + (data.introApr != null ? data.introApr : "") + '" placeholder="0"><span class="field-error hidden" data-error-for="introApr"></span></label>' +
          '<label>Months<input data-field="introMonths" aria-label="Intro promotional months" type="number" min="1" max="120" step="1" inputmode="numeric" value="' + (data.introMonths != null ? data.introMonths : "") + '" placeholder="12"><span class="field-error hidden" data-error-for="introMonths"></span></label></div></td>' +
          '<td class="amount-cell minimum-cell card-row-detail" data-label="Statement minimum payment ($)"><input data-field="minimum" aria-label="Statement minimum payment" type="number" min="0" step="0.01" inputmode="decimal" value="' + (data.minimum != null ? data.minimum : "") + '" placeholder="170"><span class="field-error hidden" data-error-for="minimum"></span></td>' +
          '<td class="remove-cell card-row-detail" data-label=""><button type="button" class="icon-button danger" data-action="remove" aria-label="Remove card" title="Remove card">×</button></td>';
        // If data has intro, expand it
        if (data.introApr != null || data.introMonths != null) {
          var introDiv = tr.querySelector(".intro-fields");
          var introBtn = tr.querySelector("[data-action='toggle-intro']");
          if (introDiv && introBtn) {
            introDiv.classList.remove("hidden");
            introBtn.textContent = "Hide promo APR";
            introBtn.setAttribute("aria-expanded", "true");
          }
        }
        tr.addEventListener("input", function () {
          updateCardSummary(tr);
        });
        updateCardSummary(tr);
        cardRows.appendChild(tr);
        if (customOrder.indexOf(id) === -1) customOrder.push(id);
        updateAddButton();
      }

      function updateAddButton() {
        addCardButton.disabled = cardRows.children.length >= MAX_CARDS;
      }

      // ── Installment Loans ─────────────────────────────────────────────────────
      function updateLoanLabels(row) {
        var name = getLoanField(row, "name") || "Loan";
        setFieldLabel(row, "name", name + " loan name");
        setFieldLabel(row, "balance", name + " balance");
        setFieldLabel(row, "rate", name + " interest rate");
        setFieldLabel(row, "payment", name + " fixed monthly payment");
        setFieldLabel(row, "term", name + " remaining term in months");
      }

      function addLoanRow(loan) {
        var data = loan || {};
        var id = data.id || "loan-" + loanNextId++;
        var idMatch = /^loan-(\d+)$/.exec(id);
        if (idMatch) loanNextId = Math.max(loanNextId, Number(idMatch[1]) + 1);
        var tr = document.createElement("tr");
        tr.className = "mobile-card-row";
        tr.dataset.id = id;
        tr.innerHTML =
          '<td class="name-cell" data-label="Loan Name"><input data-field="name" aria-label="Loan name" value="' + escapeHtml(data.name || "") + '" placeholder="Auto Loan"></td>' +
          '<td class="amount-cell" data-label="Balance ($)"><input data-field="balance" aria-label="Balance" type="number" min="0" step="0.01" inputmode="decimal" value="' + (data.balance != null ? data.balance : "") + '" placeholder="12,000"><span class="field-error hidden" data-error-for="balance"></span></td>' +
          '<td class="amount-cell" data-label="Interest Rate (%)"><input data-field="rate" aria-label="Interest rate, no percent sign needed" type="number" min="0" max="79.99" step="0.01" inputmode="decimal" value="' + (data.rate != null ? data.rate : "") + '" placeholder="6.5"><span class="field-error hidden" data-error-for="rate"></span></td>' +
          '<td class="amount-cell" data-label="Fixed Monthly Payment ($)"><input data-field="payment" aria-label="Fixed monthly payment" type="number" min="0" step="0.01" inputmode="decimal" value="' + (data.payment != null ? data.payment : "") + '" placeholder="300"><span class="field-error hidden" data-error-for="payment"></span></td>' +
          '<td class="amount-cell" data-label="Remaining Term (months, optional)"><input data-field="term" aria-label="Remaining term in months" type="number" min="1" step="1" inputmode="numeric" value="' + (data.term != null ? data.term : "") + '" placeholder="48 (optional)"><span class="field-error hidden" data-error-for="term"></span></td>' +
          '<td class="remove-cell" data-label=""><button type="button" class="icon-button danger" data-action="remove-loan" aria-label="Remove loan" title="Remove loan">×</button></td>';
        loanRows.appendChild(tr);
        tr.addEventListener("input", function () {
          updateLoanLabels(tr);
        });
        updateLoanLabels(tr);
        if (customOrder.indexOf(id) === -1) customOrder.push(id);
      }

      function getLoanField(row, field) {
        var el = row.querySelector('[data-field="' + field + '"]');
        return el ? el.value.trim() : "";
      }

      function readLoans() {
        return Array.prototype.slice.call(loanRows.querySelectorAll("tr")).map(function (row, index) {
          var nameVal = getLoanField(row, "name");
          var balanceVal = getLoanField(row, "balance");
          var rateVal = getLoanField(row, "rate");
          var paymentVal = getLoanField(row, "payment");
          var termVal = getLoanField(row, "term");
          var hasEnteredValue = [nameVal, balanceVal, rateVal, paymentVal, termVal].some(function (value) {
            return value !== "";
          });
          var loan = {
            id: row.dataset.id,
            _row: row,
            name: nameVal || "Loan " + (index + 1),
            balance: balanceVal === "" ? NaN : Number(balanceVal),
            rate: rateVal === "" ? NaN : Number(rateVal),
            payment: paymentVal === "" ? NaN : Number(paymentVal),
            term: termVal === "" ? null : Number(termVal),
            hasEnteredValue: hasEnteredValue
          };
          loan.warning = loanTermWarning(loan);
          return loan;
        }).filter(function (loan) {
          return loan.balance > 0 || (loan.balance !== 0 && loan.hasEnteredValue);
        });
      }

      function getField(row, field) {
        var el = row.querySelector('[data-field="' + field + '"]');
        return el ? el.value.trim() : "";
      }

      function readCards() {
        return Array.prototype.slice.call(cardRows.querySelectorAll("tr")).map(function (row, index) {
          var nameVal = getField(row, "name");
          var balanceVal = getField(row, "balance");
          var aprVal = getField(row, "apr");
          var minimumVal = getField(row, "minimum");
          var introAprVal = getField(row, "introApr");
          var introMonthsVal = getField(row, "introMonths");
          var introApr = introAprVal !== "" ? Number(introAprVal) : null;
          var introMonths = introMonthsVal !== "" ? Number(introMonthsVal) : null;
          var hasEnteredValue = [nameVal, balanceVal, aprVal, minimumVal, introAprVal, introMonthsVal].some(function (value) {
            return value !== "";
          });
          return {
            id: row.dataset.id,
            _row: row,
            name: nameVal || "Card " + (index + 1),
            balance: balanceVal === "" ? NaN : Number(balanceVal),
            apr: aprVal === "" ? NaN : Number(aprVal),
            minimum: minimumVal === "" ? NaN : Number(minimumVal),
            introApr: introApr,
            introMonths: introMonths,
            hasEnteredValue: hasEnteredValue
          };
        }).filter(function (card) {
          return card.balance > 0 || (card.balance !== 0 && card.hasEnteredValue);
        });
      }

      function rowHasEnteredValue(row) {
        return Array.prototype.slice.call(row.querySelectorAll("input")).some(function (input) {
          return input.value.trim() !== "";
        });
      }

      function rowHasZeroBalance(row) {
        var balance = row.querySelector('[data-field="balance"]');
        if (!balance || balance.value.trim() === "") return false;
        var value = Number(balance.value);
        return Number.isFinite(value) && Math.abs(value) <= EPSILON;
      }

      function hasOnlyZeroBalanceEntries() {
        var rows = Array.prototype.slice.call(cardRows.querySelectorAll("tr"))
          .concat(Array.prototype.slice.call(loanRows.querySelectorAll("tr")));
        var enteredRows = rows.filter(rowHasEnteredValue);
        return enteredRows.length > 0 && enteredRows.every(rowHasZeroBalance);
      }

      function hideCalculatedResults(message) {
        emptyResults.textContent = message || DEFAULT_EMPTY_MESSAGE;
        emptyResults.classList.remove("hidden");
        resultsContent.classList.add("hidden");
        scheduleRenderGeneration += 1;
        comparisonRows.innerHTML = "";
        decisionRows.innerHTML = "";
        decisionSnapshot.classList.add("hidden");
        if (payoffOptionRows) payoffOptionRows.innerHTML = "";
        if (payoffOptionNote) payoffOptionNote.textContent = "";
        if (optionCapacityNotice) {
          optionCapacityNotice.classList.add("hidden");
          optionCapacityNotice.textContent = "";
        }
        if (optionUsageSummary) {
          optionUsageSummary.classList.add("hidden");
          optionUsageSummary.innerHTML = "";
        }
        scheduleRows.innerHTML = "";
        scheduleLoading.classList.add("hidden");
        methodRecommendation.classList.add("hidden");
        methodRecommendation.textContent = "";
        if (currentPlanSummary) {
          currentPlanSummary.classList.add("hidden");
          currentPlanSummary.textContent = "";
        }
        renderCriticalWarnings([]);
        renderWarnings([]);
        clearCharts();
        lastResult = null;
        setCopySummaryAvailable(false);
        hideMobileSummary();
        updateMobilePayoffJump(false);
      }

      function updateMobilePayoffJump(show, label) {
        if (!mobilePayoffJump) return;
        mobilePayoffJump.classList.toggle("hidden", !show);
        mobilePayoffJump.textContent = label || "View payoff plan";
      }

      function setCopySummaryAvailable(isAvailable) {
        var enabled = Boolean(isAvailable) && !isSampleMode;
        if (copyLinkButton) copyLinkButton.disabled = !enabled;
        if (copySummaryButton) copySummaryButton.disabled = !enabled;
        var helper = isSampleMode
          ? "Sample plan only. Replace sample data before sharing or copying a real payoff plan."
          : enabled
          ? "Print includes the full schedule. Share links include the current debt nicknames and inputs."
          : "Share and copy controls activate after valid results are shown.";
        if (copyActionsHelp) copyActionsHelp.textContent = helper;
        if (copyLinkButton) copyLinkButton.title = isSampleMode ? "Replace sample data before sharing" : enabled ? "Copy a link to these calculator inputs" : "Enter valid debt inputs to enable share links";
        if (copySummaryButton) copySummaryButton.title = isSampleMode ? "Replace sample data before copying" : enabled ? "Copy a plain-English summary of these results" : "Enter valid debt inputs to enable summary copy";
        setCopySummaryStatus("");
      }

      function setSampleMode(enabled) {
        isSampleMode = Boolean(enabled);
        document.body.classList.toggle("sample-mode", isSampleMode);
        [sampleResultBadge, sampleResultActions, sampleHeroBadge, sampleShareNote, mobileSampleBadge].forEach(function (element) {
          if (!element) return;
          element.classList.toggle("hidden", !isSampleMode);
        });
        if (sampleChartBadge) sampleChartBadge.classList.add("hidden");
        if (copyActionsHelp && isSampleMode) {
          copyActionsHelp.textContent = "Sample plan only. Replace sample data before sharing a real payoff plan.";
        }
        setCopySummaryAvailable(Boolean(lastResult));
        if (isSampleMode) {
          hideMobileSummary();
          updateMobilePayoffJump(Boolean(lastResult), "View sample payoff plan");
        } else if (lastResult) {
          updateMobileSummary(lastResult);
          updateMobilePayoffJump(true, "View payoff plan");
        }
        if (lastResult) drawCharts(lastResult);
      }

      function confirmSampleData() {
        dismissFirstRunHint();
        setSampleMode(true);
      }

      function setPlanModeStatus(message) {
        if (!planModeStatus) return;
        planModeStatus.textContent = message || "";
        planModeStatus.classList.toggle("hidden", !message);
      }

      function markRowUpdated(row) {
        if (!row) return;
        row.classList.add("just-updated");
        var hint = row.querySelector(".row-expand-hint");
        if (hint) hint.textContent = "Updated";
        setTimeout(function () {
          row.classList.remove("just-updated");
          updateCardSummary(row);
        }, 1100);
      }

      function exitSampleForOwnPlan(row) {
        if (!isSampleMode) return;
        setSampleMode(false);
        setPlanModeStatus("You're editing the example cards. For a clean plan, choose Enter my cards.");
        markRowUpdated(row);
      }

      function setCopySummaryStatus(message) {
        if (!copySummaryStatus) return;
        copySummaryStatus.textContent = message || "";
        if (copyStatusTimer) clearTimeout(copyStatusTimer);
        if (message) {
          copyStatusTimer = setTimeout(function () {
            copySummaryStatus.textContent = "";
            copyStatusTimer = null;
          }, 2200);
        }
      }

      function showSampleActionRequired(message) {
        showFirstRunHint();
        setSampleMode(true);
        setCopySummaryStatus(message || "Replace sample data before using this action.");
        if (sampleDataBanner) sampleDataBanner.classList.remove("hidden");
        if (calculatorForm && calculatorForm.scrollIntoView) {
          calculatorForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      function setFeedbackStatus(message) {
        if (feedbackStatus) feedbackStatus.textContent = message || "";
      }

      function setFeedbackFieldError(input, field, message) {
        if (!input) return;
        var wrapper = input.closest(".field-stack") || input.parentElement;
        var error = wrapper ? wrapper.querySelector('[data-error-for="' + field + '"]') : null;
        if (error) {
          var id = input.id ? input.id + "-error" : field + "-error";
          error.id = id;
          error.textContent = message || "";
          error.classList.toggle("hidden", !message);
          if (message) {
            input.setAttribute("aria-invalid", "true");
            input.setAttribute("aria-describedby", id);
          } else {
            input.removeAttribute("aria-invalid");
            input.removeAttribute("aria-describedby");
          }
        }
      }

      function clearFeedbackErrors() {
        setFeedbackFieldError(feedbackMessage, "feedbackMessage", "");
        setFeedbackFieldError(feedbackEmail, "feedbackEmail", "");
        setFeedbackStatus("");
      }

      function openFeedbackDialog() {
        clearFeedbackErrors();
        if (feedbackDialog.showModal) {
          feedbackDialog.showModal();
        } else {
          feedbackDialog.setAttribute("open", "");
        }
        setTimeout(function () {
          if (feedbackMessage) feedbackMessage.focus();
        }, 0);
      }

      function closeFeedbackDialog() {
        clearFeedbackErrors();
        if (feedbackDialog.close) {
          feedbackDialog.close();
        } else {
          feedbackDialog.removeAttribute("open");
        }
      }

      function feedbackResultSnapshot(result) {
        if (!result) return {};
        return {
          method: result.method || methodInput.value,
          capped: Boolean(result.capped),
          months: result.months || null,
          startingBalance: roundCents(result.startingBalance || 0),
          startingMinimumTotal: roundCents(result.startingMinimumTotal || 0),
          monthlyPayment: roundCents(result.monthlyPayment || 0),
          totalInterest: roundCents(result.totalInterest || 0),
          totalPaid: roundCents(result.totalPaid || 0),
          firstTarget: result.timeline && result.timeline[0] ? result.timeline[0].target || null : null,
          warnings: (result.warnings || []).slice(0, 6),
          criticalWarnings: (result.criticalWarnings || []).slice(0, 6)
        };
      }

      function currentFeedbackInputState(cards, loans) {
        var method = methodInput.value;
        var payment = {};
        try {
          payment = currentPaymentInput(cards, loans, method);
        } catch (error) {
          payment = {
            mode: paymentMode(),
            extraPayment: Math.max(0, Number(extraInput.value || 0)),
            enteredAmount: Math.max(0, Number(extraInput.value || 0))
          };
        }
        return trackingInputState(cards, loans, {
          method: method,
          extraPayment: payment.extraPayment,
          targetDate: targetInput ? targetInput.value : null,
          startMonth: startInput ? startInput.value : null,
          paymentMode: payment.mode,
          paymentAmount: payment.enteredAmount
        });
      }

      function postFeedbackPayload(payload) {
        return fetch(SUPABASE_URL + '/rest/v1/feedback_reports', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        }).then(function (response) {
          if (!response.ok) throw new Error("Feedback request failed");
          return response;
        });
      }

      function submitFeedbackReport(event) {
        event.preventDefault();
        clearFeedbackErrors();
        var message = feedbackMessage.value.trim();
        var email = feedbackEmail.value.trim();
        if (message.length < 5) {
          setFeedbackFieldError(feedbackMessage, "feedbackMessage", "Enter at least 5 characters.");
          feedbackMessage.focus();
          return;
        }
        if (email && !feedbackEmail.checkValidity()) {
          setFeedbackFieldError(feedbackEmail, "feedbackEmail", "Enter a valid email address or leave it blank.");
          feedbackEmail.focus();
          return;
        }

        var cards = readCards();
        var loans = readLoans();
        var payload = {
          uid: getUid(),
          report_type: feedbackType.value || "issue",
          message: message.slice(0, 4000),
          email: email || null,
          page_url: String(window.location.href || "").slice(0, 2048),
          user_agent: String(navigator.userAgent || "").slice(0, 1024),
          viewport: {
            width: window.innerWidth || null,
            height: window.innerHeight || null,
            devicePixelRatio: window.devicePixelRatio || 1
          },
          input_state: currentFeedbackInputState(cards, loans),
          result_summary: feedbackResultSnapshot(lastResult),
          sample_mode: Boolean(isSampleMode),
          telemetry_opted_out: telemetryDisabled()
        };

        feedbackSubmitButton.disabled = true;
        setFeedbackStatus("Sending...");
        postFeedbackPayload(payload).then(function () {
          feedbackMessage.value = "";
          feedbackEmail.value = "";
          feedbackType.value = "issue";
          setFeedbackStatus("Thanks, your report was sent.");
          setTimeout(function () {
            feedbackSubmitButton.disabled = false;
            closeFeedbackDialog();
          }, 900);
        }).catch(function () {
          feedbackSubmitButton.disabled = false;
          setFeedbackStatus("Could not send right now. Please try again.");
        });
      }

      function buildResultsSummary(result) {
        if (!result) return "";
        var payoffDate = result.capped ? "50+ years (calculator limit reached)" : addMonths(startInput.value, result.months - 1);
        var selectedMethod = methodInput.options && methodInput.options[methodInput.selectedIndex];
        var methodLabel = selectedMethod ? selectedMethod.textContent : methodInput.value;
        var enteredPayment = Math.max(0, Number(extraInput.value || 0));
        var paymentLine = paymentMode() === "total"
          ? "Total monthly payoff budget: " + money(enteredPayment)
          : "Extra monthly payment: " + money(methodInput.value === "minimum" ? 0 : enteredPayment);
        return [
          "Card Payoff Calculator summary",
          isSampleMode ? "Sample data: replace it before treating this as your own plan." : null,
          "Payoff method: " + methodLabel,
          "Starting balance: " + money(result.startingBalance),
          paymentLine,
          "Extra above minimums: " + money(result.extraPayment),
          "Debt-free date: " + payoffDate,
          result.capped ? "Interest during 50-year model: " + money(result.totalInterest) + " and still accruing" : "Total interest: " + money(result.totalInterest),
          result.capped ? "Paid during 50-year model: " + money(result.totalPaid) : null,
          "Monthly payment: " + money(result.monthlyPayment),
          "Time to payoff: " + duration(result.months, result.capped)
        ].filter(Boolean).join("\n");
      }

      function fallbackCopyText(text) {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          return document.execCommand("copy");
        } finally {
          document.body.removeChild(textarea);
        }
      }

      function copyResultsSummary() {
        if (isSampleMode) {
          showSampleActionRequired("Replace sample data before copying a real payoff summary.");
          return;
        }
        var summary = buildResultsSummary(lastResult);
        if (!summary) {
          setCopySummaryStatus("No results yet");
          return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(summary).then(function () {
            setCopySummaryStatus("Copied");
          }).catch(function () {
            setCopySummaryStatus(fallbackCopyText(summary) ? "Copied" : "Copy failed");
          });
          return;
        }
        setCopySummaryStatus(fallbackCopyText(summary) ? "Copied" : "Copy failed");
      }

      function copyShareLink() {
        if (isSampleMode) {
          showSampleActionRequired("Replace sample data before sharing a real payoff plan.");
          return;
        }
        if (!lastResult) {
          setCopySummaryStatus("No results yet");
          return;
        }
        var method = methodInput.value;
        var cards = readCards();
        var loans = readLoans();
        var payment = currentPaymentInput(cards, loans, method);
        updateSharedUrl(cards, loans, method, payment.extraPayment, payment.mode, payment.enteredAmount);
        var shareUrl = window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(function () {
            setCopySummaryStatus("Link copied");
          }).catch(function () {
            setCopySummaryStatus(fallbackCopyText(shareUrl) ? "Link copied" : "Copy failed");
          });
          return;
        }
        setCopySummaryStatus(fallbackCopyText(shareUrl) ? "Link copied" : "Copy failed");
      }

      function validateCards(cards, loans) {
        if (!cards.length && !(loans || []).length) return "Enter at least one credit card or loan.";
        for (var i = 0; i < cards.length; i += 1) {
          var card = cards[i];
          if (!Number.isFinite(card.balance) || card.balance <= 0) {
            setFieldError(card._row, "balance", "Enter a balance above $0.");
            return card.name + ": enter a balance above $0.";
          }
          if (!Number.isFinite(card.apr) || card.apr < 0 || card.apr > MAX_APR) {
            setFieldError(card._row, "apr", "Enter an APR from 0 to 79.99. No % sign needed.");
            return card.name + ": enter an APR from 0% to 79.99%.";
          }
          if (!Number.isFinite(card.minimum) || card.minimum <= 0) {
            setFieldError(card._row, "minimum", "Enter the statement minimum above $0.");
            return card.name + ": enter a minimum payment above $0.";
          }
          if (card.introApr !== null || card.introMonths !== null) {
            if (!Number.isFinite(card.introApr) || card.introApr < 0 || card.introApr > MAX_APR) {
              setFieldError(card._row, "introApr", "Enter an intro APR from 0 to 79.99.");
              return card.name + ": enter an intro APR from 0% to 79.99%.";
            }
            if (!Number.isInteger(card.introMonths) || card.introMonths < MIN_INTRO_MONTHS || card.introMonths > MAX_INTRO_MONTHS) {
              setFieldError(card._row, "introMonths", "Enter promo months from 1 to 120.");
              return card.name + ": enter intro months from 1 to 120.";
            }
          }
        }
        return "";
      }

      function validateLoans(loans) {
        for (var i = 0; i < loans.length; i += 1) {
          var loan = loans[i];
          if (!Number.isFinite(loan.rate) || loan.rate < 0 || loan.rate > MAX_APR) {
            setFieldError(loan._row, "rate", "Enter a rate from 0 to 79.99.");
            return loan.name + ": enter an interest rate from 0% to 79.99%.";
          }
          if (!Number.isFinite(loan.payment) || loan.payment <= 0) {
            setFieldError(loan._row, "payment", "Enter a payment above $0.");
            return loan.name + ": enter a fixed monthly payment above $0";
          }
          if (!Number.isFinite(loan.balance) || loan.balance <= 0) {
            setFieldError(loan._row, "balance", "Enter a balance above $0.");
            return loan.name + ": enter a balance above $0";
          }
          if (loan.term != null && (!Number.isFinite(loan.term) || loan.term < 1)) {
            setFieldError(loan._row, "term", "Enter at least 1 month.");
            return loan.name + ": enter a remaining term of at least 1 month.";
          }
        }
        return "";
      }

      function normalizeCards(cards) {
        return cards.map(function (card, index) {
          return {
            id: card.id || "card-" + index,
            name: card.name || "Card " + (index + 1),
            balance: roundCents(Math.max(0, Number(card.balance || 0))),
            startingBalance: roundCents(Math.max(0, Number(card.balance || 0))),
            apr: Math.max(0, Number(card.apr || 0)),
            statedMinimum: roundCents(Math.max(0, Number(card.minimum || 0))),
            introApr: card.introApr != null ? Math.max(0, Number(card.introApr)) : null,
            introMonths: card.introMonths != null ? Math.max(1, Number(card.introMonths)) : null,
            type: "card"
          };
        }).filter(function (card) {
          return card.balance > EPSILON;
        });
      }

      function normalizeLoans(loans) {
        return (loans || []).map(function (loan, index) {
          return {
            id: loan.id || "loan-" + index,
            name: loan.name || "Loan " + (index + 1),
            balance: roundCents(Math.max(0, Number(loan.balance || 0))),
            startingBalance: roundCents(Math.max(0, Number(loan.balance || 0))),
            apr: Math.max(0, Number(loan.rate || 0)),
            statedMinimum: roundCents(Math.max(0, Number(loan.payment || 0))),
            fixedPayment: roundCents(Math.max(0, Number(loan.payment || 0))),
            term: loan.term == null || isNaN(loan.term) ? null : Math.max(1, Number(loan.term)),
            warning: loan.warning || "",
            introApr: null,
            introMonths: null,
            type: "loan"
          };
        }).filter(function (loan) {
          return loan.balance > EPSILON && loan.fixedPayment > EPSILON;
        });
      }

      function effectiveApr(debt, month) {
        if (debt.introApr != null && debt.introMonths != null && month <= debt.introMonths) {
          return debt.introApr;
        }
        return debt.apr;
      }

      function monthlyInterestForDebt(debt, month) {
        return roundCents(debt.balance * (effectiveApr(debt, month) / 100 / 12));
      }

      function calculatedMinimum(card, interest) {
        if (card.type === "loan") {
          return roundCents(Math.min(card.balance + interest, card.fixedPayment));
        }
        var raw = Math.max(card.balance * 0.01 + interest, 25, card.statedMinimum);
        return roundCents(Math.min(card.balance + interest, raw));
      }

      function activeDebts(debts) {
        return debts.filter(function (d) { return d.balance > EPSILON; });
      }

      function activeOrderItems(cards, loans) {
        return normalizeCards(cards).concat(normalizeLoans(loans || [])).map(function (debt) {
          return { id: debt.id, name: debt.name };
        });
      }

      function syncCustomOrder(items) {
        var activeIds = items.map(function (item) { return item.id; });
        customOrder = customOrder.filter(function (id) {
          return activeIds.indexOf(id) !== -1;
        });
        items.forEach(function (item) {
          if (customOrder.indexOf(item.id) === -1) customOrder.push(item.id);
        });
      }

      function customOrderPosition(id) {
        var index = customOrder.indexOf(id);
        return index === -1 ? Number.MAX_SAFE_INTEGER : index;
      }

      function renderCustomOrderPanel(cards, loans, method) {
        var items = activeOrderItems(cards, loans);
        syncCustomOrder(items);
        if (method !== "custom") {
          customOrderPanel.classList.add("hidden");
          customOrderList.innerHTML = "";
          return;
        }

        customOrderPanel.classList.remove("hidden");
        if (!items.length) {
          customOrderList.innerHTML = '<div class="hint">Add at least one active debt to set a custom order.</div>';
          return;
        }

        var itemById = {};
        items.forEach(function (item) { itemById[item.id] = item; });
        var ordered = customOrder.map(function (id) { return itemById[id]; }).filter(Boolean);
        customOrderList.innerHTML = ordered.map(function (item, index) {
          return '<div class="custom-order-item" data-id="' + escapeHtml(item.id) + '">' +
            '<span>' + escapeHtml(item.name) + '</span>' +
            '<div class="custom-order-actions">' +
              '<button type="button" class="secondary" data-action="custom-up" aria-label="Move ' + escapeHtml(item.name) + ' up"' + (index === 0 ? " disabled" : "") + '>↑</button>' +
              '<button type="button" class="secondary" data-action="custom-down" aria-label="Move ' + escapeHtml(item.name) + ' down"' + (index === ordered.length - 1 ? " disabled" : "") + '>↓</button>' +
            '</div>' +
          '</div>';
        }).join("");
      }

      function targetSort(method, order) {
        var selectedOrder = Array.isArray(order) ? order : customOrder;
        return function (a, b) {
          if (method === "custom") {
            var aIndex = selectedOrder.indexOf(a.id);
            var bIndex = selectedOrder.indexOf(b.id);
            var aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
            var bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
            return aRank - bRank || a.name.localeCompare(b.name);
          }
          if (method === "snowball") {
            return a.balance - b.balance || b.apr - a.apr || a.name.localeCompare(b.name);
          }
          return b.apr - a.apr || b.balance - a.balance || a.name.localeCompare(b.name);
        };
      }

      function firstTarget(debts, method, order) {
        var active = activeDebts(debts).slice().sort(targetSort(method, order));
        return active[0] ? active[0].name : "";
      }

      function maxTimelinePayment(result) {
        if (!result || !result.timeline || !result.timeline.length) return 0;
        return roundCents(result.timeline.reduce(function (max, row) {
          return Math.max(max, Number(row.payment || 0));
        }, 0));
      }

      function startingMinimumTotal(cards, loans) {
        var allDebts = normalizeCards(cards).concat(normalizeLoans(loans || []));
        return roundCents(allDebts.reduce(function (sum, debt) {
          var interest = monthlyInterestForDebt(debt, 1);
          return sum + calculatedMinimum(debt, interest);
        }, 0));
      }

      function currentPaymentInput(cards, loans, method) {
        var enteredAmount = Math.max(0, Number(extraInput.value || 0));
        var minimum = startingMinimumTotal(cards, loans || []);
        var mode = paymentMode();
        var extraPayment = mode === "total" ? Math.max(0, roundCents(enteredAmount - minimum)) : enteredAmount;
        var monthlyBudget = mode === "total" ? Math.max(minimum, roundCents(enteredAmount)) : roundCents(minimum + extraPayment);
        if (method === "minimum") extraPayment = 0;
        if (method === "minimum") monthlyBudget = minimum;
        return {
          mode: mode,
          enteredAmount: roundCents(enteredAmount),
          minimum: minimum,
          extraPayment: roundCents(extraPayment),
          monthlyBudget: roundCents(monthlyBudget)
        };
      }

      function simulate(inputCards, options, inputLoans) {
        var opts = options || {};
        var method = opts.method || "avalanche";
        var selectedCustomOrder = Array.isArray(opts.customOrder) ? opts.customOrder.map(String) : customOrder.slice();
        var cards = normalizeCards(inputCards);
        var loans = normalizeLoans(inputLoans || []);
        var allDebts = cards.concat(loans);
        var startingBalance = roundCents(allDebts.reduce(function (sum, d) { return sum + d.startingBalance; }, 0));
        var extraPayment = method === "minimum" ? 0 : roundCents(Math.max(0, Number(opts.extraPayment || 0)));
        var monthlyBudget = opts.monthlyBudget != null ? roundCents(Math.max(0, Number(opts.monthlyBudget || 0))) : null;
        if (method === "minimum") monthlyBudget = null;
        var timeline = [];
        var totalInterest = 0;
        var totalPaid = 0;
        var warnings = [];
        var criticalWarnings = [];
        var introWarnings = {};
        var summaries = allDebts.map(function (d) {
          return { id: d.id, name: d.name, startingBalance: d.startingBalance, payoffMonth: null, interestPaid: 0, type: d.type };
        });
        var payoffCounter = 0;

        // Check for minimum-payment traps (cards only)
        var zeroProgressCards = 0;
        cards.forEach(function (card) {
          var interest = roundCents(card.balance * (card.apr / 100 / 12));
          var minimum = calculatedMinimum(card, interest);
          if (card.statedMinimum <= interest + EPSILON) {
            zeroProgressCards += 1;
            warnings.push(card.name + "'s entered minimum is less than or equal to the first month's interest. The minimum payment may not reduce the balance meaningfully; consider paying more than the minimum.");
          }
          if (interest >= minimum - EPSILON) {
            warnings.push(card.name + "'s minimum payment may not reduce the balance meaningfully; consider paying more than the minimum.");
          }
        });
        loans.forEach(function (loan) {
          if (loan.warning) warnings.push(loan.warning);
          var termWarning = loanTermWarning(loan);
          if (termWarning && warnings.indexOf(termWarning) === -1) warnings.push(termWarning);
          var interest = roundCents(loan.balance * (loan.apr / 100 / 12));
          if (loan.fixedPayment <= interest + EPSILON) {
            warnings.push(loan.name + ": fixed payment is less than or equal to the first month's interest. This loan may grow unless extra payments cover the gap.");
          }
        });
        if (method === "minimum" && cards.length > 0 && zeroProgressCards === cards.length) {
          criticalWarnings.push("None of your entered minimum payments are enough to reduce any balance. You must pay more than the minimums shown to make progress.");
        }

        for (var month = 1; month <= MAX_MONTHS; month += 1) {
          if (!activeDebts(allDebts).length) break;

          var payments = allDebts.map(function () { return 0; });
          var interests = allDebts.map(function () { return 0; });
          var minimums = allDebts.map(function () { return 0; });
          var monthInterest = 0;
          var monthPayment = 0;
          var targets = [];

          allDebts.forEach(function (debt, index) {
            if (debt.balance <= EPSILON) return;
            if (debt.type === "card" && debt.introApr != null && debt.introMonths != null && month === debt.introMonths + 1 && !introWarnings[debt.id]) {
              warnings.push(debt.name + ": intro rate expired at month " + debt.introMonths + ". Standard APR of " + debt.apr + "% now applies.");
              introWarnings[debt.id] = true;
            }
            var interest = monthlyInterestForDebt(debt, month);
            interests[index] = interest;
            minimums[index] = calculatedMinimum(debt, interest);
            debt.balance = roundCents(debt.balance + interest);
            monthInterest = roundCents(monthInterest + interest);
            totalInterest = roundCents(totalInterest + interest);
            summaries[index].interestPaid = roundCents(summaries[index].interestPaid + interest);
          });

          allDebts.forEach(function (debt, index) {
            if (debt.balance <= EPSILON) return;
            var payment = Math.min(debt.balance, minimums[index]);
            debt.balance = roundCents(debt.balance - payment);
            payments[index] = roundCents(payments[index] + payment);
            monthPayment = roundCents(monthPayment + payment);
          });

          var remainingExtra = monthlyBudget != null ? Math.max(0, roundCents(monthlyBudget - monthPayment)) : extraPayment;
          while (remainingExtra > EPSILON && activeDebts(allDebts).length) {
            var target = activeDebts(allDebts).slice().sort(targetSort(method, selectedCustomOrder))[0];
            var extra = Math.min(target.balance, remainingExtra);
            var targetIndex = allDebts.indexOf(target);
            target.balance = roundCents(target.balance - extra);
            payments[targetIndex] = roundCents(payments[targetIndex] + extra);
            monthPayment = roundCents(monthPayment + extra);
            remainingExtra = roundCents(remainingExtra - extra);
            if (extra > EPSILON && targets.indexOf(target.name) === -1) targets.push(target.name);
          }

          allDebts.forEach(function (debt, index) {
            if (debt.balance <= EPSILON && summaries[index].payoffMonth === null) {
              payoffCounter += 1;
              summaries[index].payoffMonth = month;
              summaries[index].orderPaidOff = payoffCounter;
              debt.balance = 0;
            }
          });

          var endingBalance = roundCents(allDebts.reduce(function (sum, d) {
            return sum + Math.max(0, d.balance);
          }, 0));
          var principal = roundCents(monthPayment - monthInterest);
          totalPaid = roundCents(totalPaid + monthPayment);

          timeline.push({
            month: month,
            payment: monthPayment,
            interest: monthInterest,
            principal: principal,
            endingBalance: endingBalance,
            target: targets[0] || firstTarget(allDebts, method, selectedCustomOrder),
            balances: allDebts.map(function (d) { return roundCents(Math.max(0, d.balance)); }),
            debtNames: allDebts.map(function (d) { return d.name; }),
            payments: payments,
            interests: interests
          });
        }

        var capped = activeDebts(allDebts).length > 0;
        if (capped) warnings.push("This plan does not pay off all balances within 600 months (50 years).");
        var maxPayment = maxTimelinePayment({ timeline: timeline });
        var plannedMonthlyPayment = monthlyBudget != null ? monthlyBudget : roundCents(startingMinimumTotal(inputCards, inputLoans || []) + extraPayment);
        var displayedMonthlyPayment = Math.max(plannedMonthlyPayment, maxPayment);
        var plannedExtraPayment = monthlyBudget != null ? Math.max(0, plannedMonthlyPayment - startingMinimumTotal(inputCards, inputLoans || [])) : extraPayment;

        return {
          method: method,
          startingBalance: startingBalance,
          startingMinimumTotal: startingMinimumTotal(inputCards, inputLoans || []),
          extraPayment: roundCents(plannedExtraPayment),
          monthlyPayment: roundCents(displayedMonthlyPayment),
          plannedMonthlyPayment: plannedMonthlyPayment,
          months: timeline.length,
          capped: capped,
          totalInterest: roundCents(totalInterest),
          totalPaid: roundCents(totalPaid),
          maxMonthlyPayment: maxPayment,
          timeline: timeline,
          summaries: summaries,
          debtNames: allDebts.map(function (d) { return d.name; }),
          debtCount: allDebts.length,
          warnings: warnings,
          criticalWarnings: criticalWarnings
        };
      }

      function requiredPaymentForTarget(cards, loans, method, targetMonths) {
        if (!targetMonths || targetMonths <= 0) return null;
        var selectedCustomOrder = customOrder.slice();
        var minimum = startingMinimumTotal(cards, loans);
        var balances = normalizeCards(cards).concat(normalizeLoans(loans)).reduce(function (sum, d) { return sum + d.startingBalance; }, 0);
        var low = minimum;
        var high = Math.max(minimum + 100, balances + minimum);
        var i;
        for (i = 0; i < 24; i += 1) {
          var test = simulate(cards, { method: method, monthlyBudget: high, customOrder: selectedCustomOrder }, loans);
          if (!test.capped && test.months <= targetMonths) break;
          high *= 1.7;
        }
        var feasible = simulate(cards, { method: method, monthlyBudget: high, customOrder: selectedCustomOrder }, loans);
        if (feasible.capped || feasible.months > targetMonths) return null;

        for (i = 0; i < 42; i += 1) {
          var mid = (low + high) / 2;
          var result = simulate(cards, { method: method, monthlyBudget: mid, customOrder: selectedCustomOrder }, loans);
          if (!result.capped && result.months <= targetMonths) high = mid;
          else low = mid;
        }

        var payment = roundCents(high);
        var finalResult = simulate(cards, { method: method, monthlyBudget: payment, customOrder: selectedCustomOrder }, loans);
        var requiredMonthlyPayment = Math.max(payment, finalResult.maxMonthlyPayment || 0);
        return {
          monthlyPayment: roundCents(requiredMonthlyPayment),
          plannedMonthlyPayment: payment,
          extraPayment: roundCents(Math.max(0, requiredMonthlyPayment - minimum)),
          maxMonthlyPayment: finalResult.maxMonthlyPayment || payment,
          months: finalResult.months,
          totalInterest: finalResult.totalInterest
        };
      }

      function renderWarnings(warnings) {
        if (!warnings.length) {
          warningsEl.classList.add("hidden");
          warningsEl.innerHTML = "";
          return;
        }
        warningsEl.classList.remove("hidden");
        warningsEl.innerHTML = warnings.map(function (warning) {
          return "<div>" + escapeHtml(warning) + "</div>";
        }).join("");
      }

      function renderCriticalWarnings(warnings) {
        if (!warnings.length) {
          criticalWarningsEl.classList.add("hidden");
          criticalWarningsEl.innerHTML = "";
          return;
        }
        criticalWarningsEl.classList.remove("hidden");
        criticalWarningsEl.innerHTML = warnings.map(function (warning) {
          return "<div>" + escapeHtml(warning) + "</div>";
        }).join("");
      }

      function findResultByMethod(results, method) {
        return (results || []).filter(function (result) {
          return result && result.method === method;
        })[0] || null;
      }

      function renderMethodRecommendation(cards, loans, payment, comparisonResults) {
        var avalanche = findResultByMethod(comparisonResults, "avalanche") ||
          simulateWithPaymentPlan(cards, loans, payment, "avalanche");
        var snowball = findResultByMethod(comparisonResults, "snowball") ||
          simulateWithPaymentPlan(cards, loans, payment, "snowball");
        var message = methodRecommendationMessage(avalanche, snowball);

        methodRecommendation.classList.remove("hidden");
        methodRecommendation.textContent = message;
      }

      function methodRecommendationMessage(avalanche, snowball) {
        if (!avalanche || !snowball) return "";
        if (!avalanche.capped && !snowball.capped) {
          var difference = roundCents(snowball.totalInterest - avalanche.totalInterest);
          if (difference > 100) {
            return "💡 Avalanche saves you " + money(difference) + " more than Snowball";
          }
          if (difference < -100) return "💡 Snowball saves you " + money(Math.abs(difference)) + " more than Avalanche";
          return "💡 Snowball and Avalanche are nearly equal for this scenario.";
        } else if (avalanche.capped && snowball.capped) {
          var cappedDifference = roundCents(snowball.totalInterest - avalanche.totalInterest);
          if (cappedDifference > 100) {
            return "💡 Both plans remain unpaid after 50 years. Avalanche has " + money(cappedDifference) + " lower modeled interest during the 50-year window.";
          }
          if (cappedDifference < -100) {
            return "💡 Both plans remain unpaid after 50 years. Snowball has " + money(Math.abs(cappedDifference)) + " lower modeled interest during the 50-year window.";
          }
          return "💡 Both plans remain unpaid after 50 years, with similar modeled interest during the 50-year window.";
        }
        if (!avalanche.capped) return "💡 Avalanche finds a payoff path within the 50-year model.";
        return "💡 Snowball finds a payoff path within the 50-year model.";
      }

      function renderTarget(cards, loans, method) {
        var targetMonths = monthsBetweenInclusive(startInput.value, targetInput.value);
        function setInlineTarget(message) {
          if (!targetInlineResult) return;
          targetInlineResult.innerHTML = message || "";
          targetInlineResult.classList.toggle("hidden", !message);
        }
        if (!targetInput.value) {
          targetResult.classList.add("hidden");
          targetResult.innerHTML = "";
          setInlineTarget("");
          return;
        }

        if (!targetMonths) {
          targetResult.classList.remove("hidden");
          targetResult.textContent = "Target month must be in the future.";
          setInlineTarget("Choose a future month to calculate the required payment.");
          return;
        }

        if (targetMonths === 1) {
          targetResult.classList.remove("hidden");
          targetResult.textContent = "Target month must be at least one month in the future.";
          setInlineTarget("Choose a target at least one month out.");
          return;
        }

        var required = requiredPaymentForTarget(cards, loans, method === "minimum" ? "avalanche" : method, targetMonths);
        targetResult.classList.remove("hidden");
        if (!required) {
          targetResult.textContent = "The calculator could not find a monthly payment that reaches that target month within the 50-year limit.";
          setInlineTarget("The calculator could not find a required payment within the 50-year limit.");
          return;
        }

        var targetDate = escapeHtml(addMonths(startInput.value, targetMonths - 1));
        setInlineTarget("Required monthly payment: <strong>" + money(required.monthlyPayment) + "/mo</strong>");
        if (lastResult && !lastResult.capped && lastResult.months <= targetMonths) {
          targetResult.innerHTML = "Your current plan reaches <strong>" + targetDate + "</strong> or sooner. Estimated payment needed by that month: <strong>" + money(required.monthlyPayment) + "/mo</strong>.";
          return;
        }
        var missMonths = lastResult && !lastResult.capped ? lastResult.months - targetMonths : null;
        var missText = missMonths && missMonths > 0 ? "Your current plan misses this target by about <strong>" + duration(missMonths, false) + "</strong>. " : "";
        targetResult.innerHTML = missText + "To be debt-free by <strong>" + targetDate + "</strong>, estimated payment needed: <strong>" + money(required.monthlyPayment) + "/mo</strong> (" + money(required.extraPayment) + " above starting minimums).";
      }

      function renderCurrentPlanSummary(result) {
        if (!currentPlanSummary || !result || !result.timeline.length) return;
        var firstTarget = result.timeline[0].target || "your first target";
        var extraText = result.method === "minimum"
          ? "With minimum payments only"
          : "With " + money(result.extraPayment) + " extra using " + methodLabel(result.method).toLowerCase();
        var nextText = result.method === "minimum"
          ? "Next: try an extra monthly payment to see how much time and interest it saves."
          : "Next: try adding $50/month to see whether the payoff date improves enough.";
        currentPlanSummary.textContent = extraText + ", this plan targets " + firstTarget + " first. " + nextText;
        currentPlanSummary.classList.remove("hidden");
      }

      function renderSavings(selected, baseline, extraPayment) {
        if (!extraPayment || selected.method === "minimum") {
          savingsResult.classList.add("hidden");
          savingsResult.innerHTML = "";
          return;
        }

        var message = savingsMessage(selected, baseline, extraPayment);
        if (!message) {
          savingsResult.classList.add("hidden");
          savingsResult.innerHTML = "";
          return;
        }
        savingsResult.classList.remove("hidden");
        savingsResult.innerHTML = message;
      }

      function savingsMessage(selected, baseline, extraPayment) {
        if (!extraPayment || !selected || selected.method === "minimum" || !baseline) return "";
        var interestSaved = roundCents(baseline.totalInterest - selected.totalInterest);
        if (baseline.capped) {
          if (selected.capped) {
            return "Minimum-only does not clear the modeled debt within 50 years. Adding <strong>" + money(extraPayment) + "/mo</strong> lowers interest during the 50-year model by about <strong>" + money(Math.max(0, interestSaved)) + "</strong>, but this plan still does not fully pay off within the calculator limit.";
          }
          return "Minimum-only does not clear the modeled debt within 50 years. Adding <strong>" + money(extraPayment) + "/mo</strong> creates a payoff path in this scenario.";
        }

        if (selected.capped) {
          return "Adding <strong>" + money(extraPayment) + "/mo</strong> does not produce a comparable payoff within 50 years for this scenario.";
        }
        var monthsSaved = baseline.months - selected.months;
        return "Adding <strong>" + money(extraPayment) + "/mo</strong> saves about <strong>" + money(Math.max(0, interestSaved)) + "</strong> in interest and finishes <strong>" + duration(Math.max(0, monthsSaved), false) + "</strong> sooner than paying minimums only.";
      }

      function renderMonthPlan(result) {
        var firstMonth = result.timeline[0];
        if (!firstMonth || !result.debtNames.length) {
          monthPlan.classList.add("hidden");
          monthPlanRows.innerHTML = "";
          return;
        }

        monthPlan.classList.remove("hidden");
        monthPlanRows.innerHTML = result.debtNames.map(function (name, index) {
          var payment = firstMonth.payments[index] || 0;
          var interest = firstMonth.interests[index] || 0;
          var principal = roundCents(payment - interest);
          var balance = firstMonth.balances[index] || 0;
          return "<tr>" +
            "<td>" + escapeHtml(name) + "</td>" +
            "<td>" + moneyCents(payment) + "</td>" +
            "<td>" + moneyCents(interest) + "</td>" +
            "<td>" + moneyCents(Math.max(0, principal)) + "</td>" +
            "<td>" + moneyCents(balance) + "</td>" +
            "</tr>";
        }).join("");
      }

      function simulateWithPaymentPlan(cards, loans, payment, method, order) {
        var plan = payment || { mode: "extra", extraPayment: 0 };
        if (plan.mode === "total") {
          return simulate(cards, {
            method: method || "avalanche",
            monthlyBudget: plan.monthlyBudget,
            customOrder: Array.isArray(order) ? order.slice() : customOrder.slice()
          }, loans);
        }
        return simulate(cards, {
          method: method || "avalanche",
          extraPayment: plan.extraPayment || 0,
          customOrder: Array.isArray(order) ? order.slice() : customOrder.slice()
        }, loans);
      }

      function renderComparison(cards, loans, payment, preResult, preBaseline) {
        var methods = ["avalanche", "snowball", "minimum"];
        var rows = methods.map(function (method) {
          if (preResult && preResult.method === method) {
            return preResult;
          }
          if (preBaseline && method === "minimum") {
            return preBaseline;
          }
          if (method === "minimum") {
            return simulate(cards, { method: method, extraPayment: 0 }, loans);
          }
          return simulateWithPaymentPlan(cards, loans, payment, method);
        });
        var finiteRows = rows.filter(function (row) { return !row.capped; });
        var bestInterest = finiteRows.length ? Math.min.apply(null, finiteRows.map(function (row) { return row.totalInterest; })) : null;

        comparisonRows.innerHTML = rows.map(function (result) {
          var first = result.summaries.filter(function (summary) {
            return summary.payoffMonth !== null;
          }).sort(function (a, b) {
            return a.payoffMonth - b.payoffMonth;
          })[0];

          return '<tr class="' + (bestInterest !== null && result.totalInterest === bestInterest ? "best-row" : "") + '">' +
            '<td data-label="Method">' + methodLabel(result.method) + "</td>" +
            '<td data-label="Payoff date">' + (result.capped ? "50+ years" : escapeHtml(addMonths(startInput.value, result.months - 1))) + "</td>" +
            '<td data-label="Months">' + duration(result.months, result.capped) + "</td>" +
            '<td data-label="Total interest">' + comparisonInterestText(result) + "</td>" +
            '<td data-label="Monthly payment">' + money(result.monthlyPayment) + "</td>" +
            '<td data-label="First debt paid">' + (first ? escapeHtml(first.name) + " in " + duration(first.payoffMonth, false) : "-") + "</td>" +
            "</tr>";
        }).join("");
        return rows;
      }

      function comparisonInterestText(result) {
        if (!result) return "-";
        return result.capped ? "Still accruing after 50 years" : money(result.totalInterest);
      }

      function resultInterestLabel(result) {
        return result && result.capped ? "Interest During 50-Year Model" : "Total Interest";
      }

      function resultInterestText(result) {
        if (!result) return "-";
        return result.capped ? money(result.totalInterest) + " and still accruing" : money(result.totalInterest);
      }

      function resultPaidLabel(result) {
        return result && result.capped ? "Paid During 50-Year Model" : "Total Paid";
      }

      function resultPaidText(result) {
        if (!result) return "-";
        return result.capped ? money(result.totalPaid) + " paid before limit" : money(result.totalPaid);
      }

      function renderDecisionSnapshot(rows, selectedResult) {
        if (!decisionSnapshot || !decisionRows || !rows || !rows.length) return;
        var currentResult = selectedResult || rows[0];
        var currentCost = currentResult.totalInterest;
        var finiteRows = rows.filter(function (row) { return !row.capped; });
        var bestInterest = finiteRows.length ? Math.min.apply(null, finiteRows.map(function (row) { return row.totalInterest; })) : null;
        decisionRows.innerHTML = rows.map(function (result) {
          var deltaText = decisionDeltaText(result, currentResult, currentCost);
          return '<div class="decision-row ' + (bestInterest !== null && result.totalInterest === bestInterest ? "best-row" : "") + '">' +
            '<strong>' + escapeHtml(methodLabel(result.method)) + '</strong>' +
            '<span>' + (result.capped ? "50+ years" : escapeHtml(addMonths(startInput.value, result.months - 1))) + '</span>' +
            '<span>' + deltaText + '</span>' +
            '</div>';
        }).join("");
        decisionSnapshot.classList.remove("hidden");
      }

      function decisionDeltaText(result, currentResult, currentCost) {
        if (!result || !currentResult) return "";
        if (result.method === currentResult.method) return "Current";
        if (result.capped || currentResult.capped) return "Not comparable: one plan does not pay off within 50 years.";
        var delta = roundCents(result.totalInterest - currentCost);
        return Math.abs(delta) <= EPSILON ? "Same estimated cost" : (delta < 0 ? "Saves " + money(Math.abs(delta)) : "Costs " + money(delta) + " more");
      }

      function sumCardBalances(cards) {
        return cards.reduce(function (sum, card) {
          return sum + Math.max(0, Number(card.balance || 0));
        }, 0);
      }

      function weightedCardApr(cards) {
        var total = sumCardBalances(cards);
        if (total <= EPSILON) return 0;
        return cards.reduce(function (sum, card) {
          return sum + Math.max(0, Number(card.balance || 0)) * Math.max(0, Number(card.apr || 0));
        }, 0) / total;
      }

      function formatPercent(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) number = 0;
        return String(roundCents(number)).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
      }

      function currentAverageCardApr() {
        return formatPercent(weightedCardApr(readCards()));
      }

      function loanPaymentForTerm(balance, apr, months) {
        if (!months || months <= 0) return 0;
        var monthlyRate = Math.max(0, apr) / 100 / 12;
        if (monthlyRate <= EPSILON) return roundCents(balance / months);
        var factor = Math.pow(1 + monthlyRate, months);
        return roundCents(balance * monthlyRate * factor / (factor - 1));
      }

      function loanTermWarning(loan) {
        var payment = loan && loan.payment != null ? loan.payment : loan && loan.fixedPayment;
        if (!loan || !loan.term || loan.term <= 0 || !loan.balance || !payment) return "";
        var required = loanPaymentForTerm(loan.balance, loan.rate != null ? loan.rate : loan.apr, loan.term);
        if (payment + EPSILON >= required) return "";
        return loan.name + ": fixed payment is too low to pay off within the entered " + loan.term + "-month term. Estimated payment needed is " + money(required) + "/mo.";
      }

      function cloneCardWithBalance(card, balance) {
        return {
          id: card.id,
          name: card.name,
          balance: roundCents(balance),
          apr: card.apr,
          minimum: card.minimum,
          introApr: card.introApr,
          introMonths: card.introMonths
        };
      }

      function refinanceCardSort(method, order) {
        var selectedOrder = Array.isArray(order) ? order : customOrder;
        return function (a, b) {
          if (method === "custom") {
            var aIndex = selectedOrder.indexOf(a.card.id);
            var bIndex = selectedOrder.indexOf(b.card.id);
            var aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
            var bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
            return aRank - bRank || a.index - b.index;
          }
          if (method === "snowball") {
            return a.balance - b.balance || b.card.apr - a.card.apr || a.index - b.index;
          }
          return b.card.apr - a.card.apr || b.balance - a.balance || a.index - b.index;
        };
      }

      function refinanceCardsByAmount(cards, amount, method, order) {
        var cappedAmount = Math.min(roundCents(sumCardBalances(cards)), Math.max(0, roundCents(amount)));
        var remaining = cards.map(function (card, index) {
          return {
            card: card,
            index: index,
            balance: roundCents(Math.max(0, Number(card.balance || 0)))
          };
        });
        var amountLeft = cappedAmount;
        var appliedCardIds = [];
        var coverage = [];
        remaining.slice().sort(refinanceCardSort(method || "avalanche", order)).forEach(function (item) {
          if (amountLeft <= EPSILON) return;
          var startingBalance = item.balance;
          var applied = Math.min(item.balance, amountLeft);
          item.balance = roundCents(item.balance - applied);
          amountLeft = roundCents(amountLeft - applied);
          if (applied > EPSILON) {
            if (appliedCardIds.indexOf(item.card.id) === -1) appliedCardIds.push(item.card.id);
            coverage.push({
              id: item.card.id,
              name: item.card.name || "Card " + (item.index + 1),
              startingBalance: startingBalance,
              appliedAmount: roundCents(applied),
              remainingBalance: item.balance
            });
          }
        });
        return {
          amount: cappedAmount,
          appliedCardIds: appliedCardIds,
          coverage: coverage,
          remainingCards: remaining.filter(function (item) {
            return item.balance > EPSILON;
          }).map(function (item) {
            return cloneCardWithBalance(item.card, item.balance);
          })
        };
      }

      function syncDefaultOptionAmountFields(cardTotal) {
        if (!optionScenarioList) return;
        var defaultAmount = cardTotal > EPSILON ? String(roundCents(cardTotal)) : "";
        Array.prototype.slice.call(optionScenarioList.querySelectorAll('[data-option-field="amount"]')).forEach(function (input) {
          if (input.dataset.optionAutoDefault === "true") {
            input.value = defaultAmount;
            input.setAttribute("value", defaultAmount);
          }
        });
      }

      function currentDefaultOptionAmount() {
        var cardTotal = roundCents(sumCardBalances(readCards()));
        return cardTotal > EPSILON ? String(cardTotal) : "";
      }

      function optionScenarioTitle(type) {
        if (!optionScenarioList) return type === "balance-transfer" ? "Balance transfer offer" : "Consolidation loan offer";
        var count = Array.prototype.slice.call(optionScenarioList.querySelectorAll(".option-fieldset")).filter(function (scenario) {
          return scenario.dataset.optionType === type;
        }).length + 1;
        return type === "balance-transfer" ? "Balance transfer offer " + count : "Consolidation loan offer " + count;
      }

      function optionScenarioInputHtml(label, field, value, attrs, placeholder) {
        return '<label>' + label + '<input data-option-field="' + field + '" ' + attrs +
          ' value="' + escapeHtml(value == null ? "" : value) + '"' +
          (placeholder ? ' placeholder="' + escapeHtml(placeholder) + '"' : "") +
          '></label>';
      }

      function optionScenarioCount() {
        return optionScenarioList ? optionScenarioList.querySelectorAll(".option-fieldset").length : 0;
      }

      function updateOptionScenarioLimitState() {
        if (!payoffOptions) return;
        var atLimit = optionScenarioCount() >= MAX_PAYOFF_OPTIONS;
        Array.prototype.slice.call(payoffOptions.querySelectorAll('[data-action="add-balance-transfer"], [data-action="add-consolidation-loan"]')).forEach(function (button) {
          button.disabled = atLimit;
          button.title = atLimit ? "Remove an offer before adding another. Up to " + MAX_PAYOFF_OPTIONS + " offers can be compared exhaustively." : "";
        });
      }

      function addOptionScenario(type, data) {
        if (!optionScenarioList) return;
        if (optionScenarioCount() >= MAX_PAYOFF_OPTIONS) {
          updateOptionScenarioLimitState();
          return null;
        }
        var values = data || {};
        var scenario = document.createElement("fieldset");
        scenario.className = "option-fieldset";
        scenario.dataset.optionType = type;
        scenario.dataset.optionId = "option-" + optionScenarioNextId++;

        var inputs = "";
        var help = "";
        if (type === "balance-transfer") {
          inputs = optionScenarioInputHtml("Available transfer limit ($)", "amount", values.amount != null ? values.amount : currentDefaultOptionAmount(), 'type="number" min="0" step="1" inputmode="decimal" data-option-auto-default="' + (values.amount == null ? "true" : "false") + '"', "Full balance") +
            optionScenarioInputHtml("Transfer Fee (%)", "fee", values.fee != null ? values.fee : 3, 'type="number" min="0" max="20" step="0.1" inputmode="decimal"', "") +
            optionScenarioInputHtml("Intro APR (%)", "introApr", values.introApr != null ? values.introApr : 0, 'type="number" min="0" max="79.99" step="0.01" inputmode="decimal"', "") +
            optionScenarioInputHtml("Promo Term (months)", "introMonths", values.introMonths != null ? values.introMonths : 18, 'type="number" min="1" max="120" step="1" inputmode="numeric"', "") +
            optionScenarioInputHtml("Post-Promo APR (%)", "postApr", values.postApr != null ? formatPercent(values.postApr) : currentAverageCardApr(), 'type="number" min="0" max="79.99" step="0.01" inputmode="decimal"', "");
          help = "Enter the balance transfer offer terms: fee, intro APR, promo term, and APR after the promo ends.";
        } else {
          inputs = optionScenarioInputHtml("Available loan amount ($)", "amount", values.amount != null ? values.amount : currentDefaultOptionAmount(), 'type="number" min="0" step="1" inputmode="decimal" data-option-auto-default="' + (values.amount == null ? "true" : "false") + '"', "Full balance") +
            optionScenarioInputHtml("Loan APR (%)", "apr", values.apr != null ? values.apr : 12.99, 'type="number" min="0" max="79.99" step="0.01" inputmode="decimal"', "") +
            optionScenarioInputHtml("Loan Term (months)", "term", values.term != null ? values.term : 36, 'type="number" min="1" max="360" step="1" inputmode="numeric"', "") +
            optionScenarioInputHtml("Origination Fee (%)", "fee", values.fee != null ? values.fee : 3, 'type="number" min="0" max="20" step="0.1" inputmode="decimal"', "");
          help = "Enter the consolidation loan offer terms: amount, APR, loan term, and origination fee.";
        }

        var title = optionScenarioTitle(type);
        scenario.innerHTML = '<div class="option-fieldset-head"><strong>' + escapeHtml(title) + '</strong>' +
          '<button type="button" class="icon-button danger" data-action="remove-option-scenario" aria-label="Remove ' + escapeHtml(title) + '" title="Remove option">×</button></div>' +
          '<p class="option-scenario-help">' + escapeHtml(help) + '</p>' +
          '<div class="option-inputs">' + inputs + '</div>';
        optionScenarioList.appendChild(scenario);
        updateOptionScenarioLimitState();
        return scenario;
      }

      function resetDefaultOptionScenarios() {
        if (!optionScenarioList) return;
        optionScenarioList.innerHTML = "";
        optionScenarioNextId = 1;
        updateOptionScenarioLimitState();
      }

      function getOptionField(scenario, field) {
        var input = scenario.querySelector('[data-option-field="' + field + '"]');
        return input ? input.value.trim() : "";
      }

      function optionNumberValue(value, fallback, min, max) {
        var number = value !== "" ? Number(value) : fallback;
        if (!Number.isFinite(number)) number = fallback;
        number = Math.max(min, number);
        if (max != null) number = Math.min(max, number);
        return number;
      }

      function optionCapacityValue(value, fallback) {
        return optionNumberValue(value, fallback, 0, Number.MAX_SAFE_INTEGER);
      }

      function optionSortRate(type, values, payoffMonths) {
        var horizon = Math.max(1, Number(payoffMonths || 1));
        var feeEquivalentApr = Number(values.feeRate || 0) * 12 / horizon;
        if (type === "balance-transfer") {
          var introMonths = Math.min(horizon, Math.max(0, Number(values.introMonths || 0)));
          var postMonths = Math.max(0, horizon - introMonths);
          var weightedApr = ((Number(values.introApr || 0) * introMonths) + (Number(values.postApr || 0) * postMonths)) / horizon;
          return roundCents(weightedApr + feeEquivalentApr);
        }
        return roundCents(Number(values.apr || 0) + feeEquivalentApr);
      }

      function optionModeledCostScore(entry, payoffMonths) {
        var horizon = Math.max(1, Math.round(Number(payoffMonths || entry.term || 36)));
        var modeledAmount = 1000;
        var fee = roundCents(modeledAmount * Number(entry.feeRate || 0) / 100);
        var balance = roundCents(modeledAmount + fee);
        var result;
        if (entry.type === "balance-transfer") {
          result = simulate([{
            id: "modeled-balance-transfer",
            name: "Modeled balance transfer",
            balance: balance,
            apr: entry.postApr,
            minimum: 25,
            introApr: entry.introApr,
            introMonths: entry.introMonths
          }], { method: "avalanche", monthlyBudget: Math.max(25, loanPaymentForTerm(balance, entry.postApr, horizon)) }, []);
          return roundCents(result.totalInterest + fee);
        }
        result = simulate([], { method: "avalanche", monthlyBudget: loanPaymentForTerm(balance, entry.apr, entry.term || horizon) }, [{
          id: "modeled-consolidation-loan",
          name: "Modeled consolidation loan",
          balance: balance,
          rate: entry.apr,
          payment: loanPaymentForTerm(balance, entry.apr, entry.term || horizon),
          term: entry.term || horizon
        }]);
        return roundCents(result.totalInterest + fee);
      }

      function optionActualCostScore(entry, cards, loans, payment, method, order) {
        var cardTotal = roundCents(sumCardBalances(cards || []));
        var entryAmount = Math.min(cardTotal, Math.max(0, roundCents(Number(entry && entry.amount || 0))));
        if (!entry || entryAmount <= EPSILON) return Number.POSITIVE_INFINITY;
        var refinanced = refinanceCardsByAmount(cards || [], entryAmount, method, order);
        var fee = roundCents(entryAmount * Number(entry.feeRate || 0) / 100);
        var entryBalance = roundCents(entryAmount + fee);
        var debtId = "score-" + entry.type;
        var scoreCards = refinanced.remainingCards.slice();
        var scoreLoans = (loans || []).slice();
        if (entry.type === "balance-transfer") {
          scoreCards.push({
            id: debtId,
            name: entry.name || "Balance transfer",
            balance: entryBalance,
            apr: entry.postApr,
            minimum: 25,
            introApr: entry.introApr,
            introMonths: entry.introMonths
          });
        } else {
          scoreLoans.push({
            id: debtId,
            name: entry.name || "Consolidation loan",
            balance: entryBalance,
            rate: entry.apr,
            payment: loanPaymentForTerm(entryBalance, entry.apr, entry.term || 36),
            term: entry.term || 36
          });
        }
        var scoreOrder = method === "custom"
          ? buildOfferCustomOrder(order || customOrder, refinanced.remainingCards, [debtId], refinanced.appliedCardIds)
          : order;
        var result = simulateWithPaymentPlan(scoreCards, scoreLoans, payment, method, scoreOrder);
        return result.capped ? Number.POSITIVE_INFINITY : roundCents(result.totalInterest + fee);
      }

      function optionSavingsPerDollar(entry, actualCost, baselineResult, cardTotal) {
        var entryAmount = Math.min(roundCents(cardTotal || 0), Math.max(0, roundCents(Number(entry && entry.amount || 0))));
        if (entryAmount <= EPSILON || !Number.isFinite(actualCost)) return Number.NEGATIVE_INFINITY;
        if (baselineResult && baselineResult.capped) return roundCents(-actualCost / entryAmount);
        if (!baselineResult) return Number.NEGATIVE_INFINITY;
        return Math.round(((baselineResult.totalInterest - actualCost) / entryAmount) * 10000) / 10000;
      }

      function compareModeledSavings(a, b) {
        var aSavings = a.modeledSavingsPerDollar;
        var bSavings = b.modeledSavingsPerDollar;
        if (aSavings === bSavings) return 0;
        if (aSavings === Number.POSITIVE_INFINITY || bSavings === Number.NEGATIVE_INFINITY) return -1;
        if (bSavings === Number.POSITIVE_INFINITY || aSavings === Number.NEGATIVE_INFINITY) return 1;
        return bSavings - aSavings;
      }

      function scorePayoffScenarioEntries(scenario, cards, loans, payment, method, order, baselineResult) {
        if (!scenario || !Array.isArray(scenario.entries)) return scenario;
        var cardTotal = roundCents(sumCardBalances(cards || []));
        var baseline = baselineResult || simulateWithPaymentPlan(cards || [], loans || [], payment, method, order);
        scenario.entries.forEach(function (entry) {
          entry.modeledCostScore = optionActualCostScore(entry, cards, loans, payment, method, order);
          entry.modeledSavingsPerDollar = optionSavingsPerDollar(entry, entry.modeledCostScore, baseline, cardTotal);
        });
        scenario.entries.sort(function (a, b) {
          return compareModeledSavings(a, b) || a.modeledCostScore - b.modeledCostScore || a.sortRate - b.sortRate || a.feeRate - b.feeRate || a.amount - b.amount;
        });
        return scenario;
      }

      function buildPayoffScenarioModel(scenario, cards, loans, payment, method, order, scenarioIndex) {
        var refinanced = refinanceCardsByAmount(cards || [], scenario.amount, method, order);
        var model = {
          refinanced: refinanced,
          allocation: [],
          optionFees: 0,
          optionTerms: [],
          optionDebtIds: [],
          earliestPromoEnd: null,
          result: null,
          offerMaxPayment: 0,
          totalCost: Number.POSITIVE_INFINITY
        };
        if (refinanced.amount <= EPSILON) return model;
        var amountLeft = refinanced.amount;
        var btCards = [];
        var optionLoans = [];
        var coverageIndex = 0;
        var coverageRemaining = refinanced.coverage && refinanced.coverage[0] ? refinanced.coverage[0].appliedAmount : 0;
        function takeAppliedDebts(amount) {
          var remainingAmount = roundCents(amount);
          var appliedDebts = [];
          while (remainingAmount > EPSILON && coverageIndex < (refinanced.coverage || []).length) {
            var coverage = refinanced.coverage[coverageIndex];
            var applied = Math.min(coverageRemaining, remainingAmount);
            appliedDebts.push({
              id: coverage.id,
              name: coverage.name,
              appliedAmount: roundCents(applied)
            });
            remainingAmount = roundCents(remainingAmount - applied);
            coverageRemaining = roundCents(coverageRemaining - applied);
            if (coverageRemaining <= EPSILON) {
              coverageIndex += 1;
              coverageRemaining = refinanced.coverage[coverageIndex] ? refinanced.coverage[coverageIndex].appliedAmount : 0;
            }
          }
          return appliedDebts;
        }
        (scenario.entries || []).forEach(function (entry, entryIndex) {
          if (amountLeft <= EPSILON) {
            model.allocation.push({
              name: entry.name,
              enteredAmount: entry.amount,
              usedAmount: 0,
              unusedAmount: entry.amount,
              appliedDebts: [],
              sortRate: entry.sortRate,
              modeledCostScore: entry.modeledCostScore,
              modeledSavingsPerDollar: entry.modeledSavingsPerDollar
            });
            return;
          }
          var entryAmount = Math.min(entry.amount, amountLeft);
          amountLeft = roundCents(amountLeft - entryAmount);
          model.allocation.push({
            name: entry.name,
            enteredAmount: entry.amount,
            usedAmount: entryAmount,
            unusedAmount: roundCents(entry.amount - entryAmount),
            appliedDebts: takeAppliedDebts(entryAmount),
            sortRate: entry.sortRate,
            modeledCostScore: entry.modeledCostScore,
            modeledSavingsPerDollar: entry.modeledSavingsPerDollar
          });
          if (entryAmount <= EPSILON) return;
          var entryFee = roundCents(entryAmount * entry.feeRate / 100);
          model.optionFees = roundCents(model.optionFees + entryFee);
          if (entry.type === "balance-transfer") {
            var transferId = "option-balance-transfer-" + scenarioIndex + "-" + entryIndex;
            btCards.push({
              id: transferId,
              name: entry.name + " card",
              balance: roundCents(entryAmount + entryFee),
              apr: entry.postApr,
              minimum: 25,
              introApr: entry.introApr,
              introMonths: entry.introMonths
            });
            model.optionDebtIds.push(transferId);
            model.earliestPromoEnd = model.earliestPromoEnd == null ? entry.introMonths : Math.min(model.earliestPromoEnd, entry.introMonths);
            model.optionTerms.push(entry.name + ": " + money(entryAmount) + " at " + formatPercent(entry.feeRate) + "% fee, " + formatPercent(entry.introApr) + "% intro APR for " + entry.introMonths + " months, then " + formatPercent(entry.postApr) + "% APR");
            return;
          }
          var loanId = "option-consolidation-loan-" + scenarioIndex + "-" + entryIndex;
          var entryBalance = roundCents(entryAmount + entryFee);
          optionLoans.push({
            id: loanId,
            name: entry.name,
            balance: entryBalance,
            rate: entry.apr,
            payment: loanPaymentForTerm(entryBalance, entry.apr, entry.term),
            term: entry.term
          });
          model.optionDebtIds.push(loanId);
          model.optionTerms.push(entry.name + ": " + money(entryAmount) + " at " + formatPercent(entry.apr) + "% APR for " + entry.term + " months with " + formatPercent(entry.feeRate) + "% fee");
        });
        var offerOrder = method === "custom"
          ? buildOfferCustomOrder(order || customOrder, model.refinanced.remainingCards, model.optionDebtIds, model.refinanced.appliedCardIds)
          : order;
        model.result = simulateWithPaymentPlan(
          model.refinanced.remainingCards.concat(btCards),
          (loans || []).concat(optionLoans),
          payment,
          method,
          offerOrder
        );
        model.offerMaxPayment = maxTimelinePayment(model.result);
        model.totalCost = roundCents(model.result.totalInterest + model.optionFees);
        return model;
      }

      function comparePayoffScenarioModels(a, b) {
        if (!a) return 1;
        if (!b) return -1;
        var aCapped = !a.result || a.result.capped;
        var bCapped = !b.result || b.result.capped;
        if (aCapped !== bCapped) return aCapped ? 1 : -1;
        return a.totalCost - b.totalCost || a.result.months - b.result.months || a.offerMaxPayment - b.offerMaxPayment;
      }

      function optimizePayoffScenarioOrder(scenario, cards, loans, payment, method, order, scenarioIndex, baselineResult) {
        scorePayoffScenarioEntries(scenario, cards, loans, payment, method, order, baselineResult);
        var entries = (scenario && scenario.entries || []).slice();
        if (entries.length < 2) {
          scenario.bestModel = buildPayoffScenarioModel(scenario, cards, loans, payment, method, order, scenarioIndex || 0);
          return scenario;
        }
        var bestModel = null;
        var bestEntries = entries.slice();
        var evaluated = 0;
        var maxEvaluations = 50000;
        function visit(prefix, remaining, covered) {
          if (evaluated >= maxEvaluations) return;
          if (!remaining.length || covered >= scenario.amount - EPSILON) {
            var ordered = prefix.concat(remaining);
            var candidate = {
              type: scenario.type,
              name: scenario.name,
              amount: scenario.amount,
              totalAvailable: scenario.totalAvailable,
              extraAvailable: scenario.extraAvailable,
              entries: ordered
            };
            var model = buildPayoffScenarioModel(candidate, cards, loans, payment, method, order, scenarioIndex || 0);
            evaluated += 1;
            if (!bestModel || comparePayoffScenarioModels(model, bestModel) < 0) {
              bestModel = model;
              bestEntries = ordered.slice();
            }
            return;
          }
          remaining.forEach(function (entry, index) {
            var nextRemaining = remaining.slice(0, index).concat(remaining.slice(index + 1));
            visit(prefix.concat([entry]), nextRemaining, roundCents(covered + Math.max(0, Number(entry.amount || 0))));
          });
        }
        visit([], entries, 0);
        scenario.entries = bestEntries;
        scenario.bestModel = bestModel || buildPayoffScenarioModel(scenario, cards, loans, payment, method, order, scenarioIndex || 0);
        return scenario;
      }

      function readPayoffOptionScenarios(averageApr, cardTotal, payoffMonths) {
        if (!optionScenarioList) return [];
        var entries = [];
        var balanceTransferCount = 0;
        var consolidationCount = 0;
        Array.prototype.slice.call(optionScenarioList.querySelectorAll(".option-fieldset")).slice(0, MAX_PAYOFF_OPTIONS).forEach(function (scenario) {
          var type = scenario.dataset.optionType;
          if (type === "balance-transfer") {
            balanceTransferCount += 1;
            var introApr = optionNumberValue(getOptionField(scenario, "introApr"), 0, 0, MAX_APR);
            entries.push({
              type: type,
              name: "Balance transfer " + balanceTransferCount,
              amount: optionCapacityValue(getOptionField(scenario, "amount"), cardTotal),
              feeRate: optionNumberValue(getOptionField(scenario, "fee"), 3, 0, 20),
              introApr: introApr,
              introMonths: Math.round(optionNumberValue(getOptionField(scenario, "introMonths"), 18, MIN_INTRO_MONTHS, MAX_INTRO_MONTHS)),
              postApr: optionNumberValue(getOptionField(scenario, "postApr"), averageApr, 0, MAX_APR),
              sortRate: 0,
              modeledCostScore: 0
            });
            entries[entries.length - 1].sortRate = optionSortRate(type, entries[entries.length - 1], payoffMonths);
            entries[entries.length - 1].modeledCostScore = optionModeledCostScore(entries[entries.length - 1], payoffMonths);
            return;
          }
          consolidationCount += 1;
          var apr = optionNumberValue(getOptionField(scenario, "apr"), 12.99, 0, MAX_APR);
          entries.push({
            type: "consolidation-loan",
            name: "Consolidation loan" + (consolidationCount > 1 ? " " + consolidationCount : ""),
            amount: optionCapacityValue(getOptionField(scenario, "amount"), cardTotal),
            apr: apr,
            term: Math.round(optionNumberValue(getOptionField(scenario, "term"), 36, 1, 360)),
            feeRate: optionNumberValue(getOptionField(scenario, "fee"), 3, 0, 20),
            sortRate: 0,
            modeledCostScore: 0
          });
          entries[entries.length - 1].sortRate = optionSortRate("consolidation-loan", entries[entries.length - 1], payoffMonths);
          entries[entries.length - 1].modeledCostScore = optionModeledCostScore(entries[entries.length - 1], payoffMonths);
        });
        if (!entries.length) return [];
        var totalAvailable = roundCents(entries.reduce(function (total, entry) {
          return total + entry.amount;
        }, 0));
        entries.sort(function (a, b) {
          return a.modeledCostScore - b.modeledCostScore || a.sortRate - b.sortRate || a.feeRate - b.feeRate || a.amount - b.amount;
        });
        var hasBalanceTransfers = entries.some(function (entry) { return entry.type === "balance-transfer"; });
        var hasConsolidationLoans = entries.some(function (entry) { return entry.type === "consolidation-loan"; });
        var scenarioName = hasBalanceTransfers && hasConsolidationLoans
          ? "Combined balance transfer and loan offers"
          : hasBalanceTransfers ? "Combined balance transfers" : "Combined consolidation loans";
        return [{
          type: "combined-new-credit",
          name: scenarioName,
          amount: Math.min(cardTotal, totalAvailable),
          totalAvailable: totalAvailable,
          extraAvailable: Math.max(0, roundCents(totalAvailable - cardTotal)),
          entries: entries
        }];
      }

      function optionDifferenceText(row) {
        if (!row || row.currentCapped || (row.result && row.result.capped)) {
          return "Not comparable: one plan does not pay off within 50 years.";
        }
        var modeledDifference = roundCents(row.currentCost - row.totalCost);
        return Math.abs(modeledDifference) <= EPSILON
          ? "No modeled difference"
          : modeledDifference > 0
            ? money(modeledDifference) + " lower"
            : money(Math.abs(modeledDifference)) + " higher";
      }

      function optionSavingsLabel(value) {
        if (value === Number.POSITIVE_INFINITY) return "Best finite payoff";
        if (value === Number.NEGATIVE_INFINITY || !Number.isFinite(value)) return "Not comparable";
        return moneyCents(value) + "/$";
      }

      function optionCostLabel(row) {
        return row && row.result && row.result.capped ? "Interest + fees during 50-year model" : "Interest + fees";
      }

      function optionCostText(row) {
        if (!row) return "-";
        return row.result && row.result.capped ? money(row.totalCost) + " and still accruing" : money(row.totalCost);
      }

      function renderPayoffOptionRow(row, bestCost) {
        if (row.unavailable) {
          return '<div class="option-card"><h4>' + escapeHtml(row.name) + '</h4><p class="option-watchout">' + escapeHtml(row.reason) + '</p></div>';
        }
        var result = row.result;
        var monthlyPayment = row.displayMonthlyPayment != null ? row.displayMonthlyPayment : result.monthlyPayment;
        var differenceText = optionDifferenceText(row);
        var isLowest = row.totalCost === bestCost;
        var risk = "";
        var assumptions = row.assumptions || "";
        if (row.type === "balance-transfer") {
          risk = "Approval and transfer limit are not guaranteed. Fees, lower approved limits, post-promo APR, missed payments, or new purchases can make the modeled cost worse.";
        } else if (row.type === "consolidation-loan") {
          risk = "Approval, APR, amount, fees, and term are not guaranteed. A longer term can reduce monthly pressure while keeping debt around longer.";
        } else if (row.type === "combined-new-credit") {
          risk = "Approval, transfer limits, loan amounts, APRs, fees, and terms are not guaranteed. New purchases or missed payments can make debt worse.";
        } else {
          risk = "Current-plan baseline assumes no new credit product and no new charges.";
        }
        return '<div class="option-card ' + (isLowest ? "modeled-lowest" : "") + '">' +
          '<span class="option-badge">Math model only' + (isLowest ? " - lowest estimate in this comparison" : "") + '</span>' +
          "<h4>" + escapeHtml(row.name) + "</h4>" +
          (assumptions ? '<p class="option-assumptions">' + escapeHtml(assumptions) + "</p>" : "") +
          (row.amount != null ? '<div class="summary-line"><span>Debt covered</span><strong>' + money(row.amount) + "</strong></div>" : "") +
          '<div class="summary-line"><span>Payoff date</span><strong>' + (result.capped ? "50+ years" : escapeHtml(addMonths(startInput.value, result.months - 1))) + "</strong></div>" +
          '<div class="summary-line"><span>Monthly payment</span><strong>' + money(monthlyPayment) + "</strong></div>" +
          '<div class="summary-line"><span>' + optionCostLabel(row) + '</span><strong>' + optionCostText(row) + "</strong></div>" +
          '<div class="summary-line"><span>Estimated cost difference vs current plan</span><strong>' + differenceText + "</strong></div>" +
          '<p class="option-watchout">' + escapeHtml(row.watchout || "") + "</p>" +
          '<p class="option-risk">' + escapeHtml(risk) + "</p>" +
          "</div>";
      }

      function renderOptionUsageSummary(scenario, allocation, result, cardTotal) {
        if (!optionUsageSummary || !scenario || !allocation) return;
        var summaryRows = allocation.map(function (entry) {
          var appliedDebtNames = (entry.appliedDebts || []).length
            ? '<span class="applied-debt-list">' + entry.appliedDebts.map(function (debt) {
              return "<span>" + escapeHtml(debt.name) + " (" + money(debt.appliedAmount) + ")</span>";
            }).join("") + "</span>"
            : "-";
          return "<tr>" +
            '<td data-label="Offer">' + escapeHtml(entry.name) + "</td>" +
            '<td data-label="Entered">' + money(entry.enteredAmount) + "</td>" +
            '<td data-label="Used">' + money(entry.usedAmount) + "</td>" +
            '<td data-label="Unused">' + money(entry.unusedAmount) + "</td>" +
            '<td data-label="Applied to">' + appliedDebtNames + "</td>" +
            '<td data-label="Modeled savings per $">' + optionSavingsLabel(entry.modeledSavingsPerDollar) + "</td>" +
            "</tr>";
        }).join("");
        var debtRows = ((scenario.bestModel && scenario.bestModel.refinanced && scenario.bestModel.refinanced.coverage) || []).map(function (debt) {
          return "<tr>" +
            '<td data-label="Debt">' + escapeHtml(debt.name) + "</td>" +
            '<td data-label="Current balance">' + money(debt.startingBalance) + "</td>" +
            '<td data-label="Moved to offers">' + money(debt.appliedAmount) + "</td>" +
            '<td data-label="Balance remaining">' + money(debt.remainingBalance) + "</td>" +
            "</tr>";
        }).join("");
        var payoffText = result
          ? (result.capped ? "50+ years" : escapeHtml(addMonths(startInput.value, result.months - 1)))
          : "-";
        optionUsageSummary.innerHTML =
          "<h4>How offers are used</h4>" +
          '<div class="option-summary-grid">' +
            '<div class="option-summary-metric"><span>Offer capacity</span><strong>' + money(scenario.totalAvailable) + "</strong></div>" +
            '<div class="option-summary-metric"><span>Eligible card debt</span><strong>' + money(cardTotal) + "</strong></div>" +
            '<div class="option-summary-metric"><span>Amount used</span><strong>' + money(scenario.amount) + "</strong></div>" +
            '<div class="option-summary-metric"><span>Unused capacity</span><strong>' + money(scenario.extraAvailable) + "</strong></div>" +
          "</div>" +
          '<p class="option-scenario-help">Combined scenario: ' + money(scenario.amount) + " moved, " + money(scenario.extraAvailable) + " unused, estimated payoff " + payoffText + ".</p>" +
          '<p class="option-plain-summary">What this means: the calculator moves existing card balances into the cheapest offer order it can model first.</p>' +
          '<div class="table-scroll"><table class="allocation-table offer-allocation-table"><thead><tr><th>Offer</th><th>Entered</th><th>Used</th><th>Unused</th><th>Applied to</th><th>Modeled savings per $</th></tr></thead><tbody>' +
          summaryRows +
          "</tbody></table></div>" +
          (debtRows ? '<div class="table-scroll"><table class="allocation-table"><thead><tr><th>Debt</th><th>Current balance</th><th>Moved to offers</th><th>Balance remaining</th></tr></thead><tbody>' + debtRows + "</tbody></table></div>" : "");
        optionUsageSummary.classList.remove("hidden");
      }

      function renderPayoffOptions(cards, loans, currentResult, payment) {
        if (!payoffOptionRows || !payoffOptionNote) return;
        var cardTotal = roundCents(sumCardBalances(cards));
        if (cardTotal <= EPSILON) {
          payoffOptionRows.innerHTML = '<div class="option-card"><p class="option-watchout">Add at least one credit card balance to model balance transfers or consolidation loans.</p></div>';
          payoffOptionNote.textContent = "";
          optionCapacityNotice.classList.add("hidden");
          optionCapacityNotice.textContent = "";
          optionUsageSummary.classList.add("hidden");
          optionUsageSummary.innerHTML = "";
          return;
        }

        var currentMaxPayment = maxTimelinePayment(currentResult);
        var currentCost = currentResult.totalInterest;
        var averageApr = weightedCardApr(cards);
        syncDefaultOptionAmountFields(cardTotal);
        var scenarios = readPayoffOptionScenarios(averageApr, cardTotal, currentResult.months);
        if (!scenarios.length) {
          optionCapacityNotice.classList.add("hidden");
          optionCapacityNotice.textContent = "";
          optionUsageSummary.classList.add("hidden");
          optionUsageSummary.innerHTML = "";
          payoffOptionRows.innerHTML = '<div class="option-card"><h4>No optional scenarios added</h4><p class="option-watchout">Add a balance transfer or consolidation loan only if you want to model a new-credit scenario against the current plan.</p></div>';
          payoffOptionNote.textContent = "Scenario amount defaults will use your current credit card balance when you add an option.";
          return;
        }
        var combinedScenario = optimizePayoffScenarioOrder(scenarios[0], cards, loans, payment, methodInput.value, customOrder, 0, currentResult);
        if (combinedScenario.extraAvailable > EPSILON) {
          optionCapacityNotice.innerHTML = "You entered <strong>" + money(combinedScenario.totalAvailable) + "</strong> in balance transfer/loan capacity for <strong>" + money(cardTotal) + "</strong> in credit card debt. The model uses <strong>" + money(combinedScenario.amount) + "</strong>, leaves <strong>" + money(combinedScenario.extraAvailable) + "</strong> unused, and applies the cheapest offer order it can model.";
          optionCapacityNotice.classList.remove("hidden");
        } else {
          optionCapacityNotice.classList.add("hidden");
          optionCapacityNotice.textContent = "";
        }
        optionUsageSummary.classList.add("hidden");
        optionUsageSummary.innerHTML = "";

        var rows = [
          {
            type: "current",
            name: "Current plan",
            result: currentResult,
            displayMonthlyPayment: currentMaxPayment,
            totalCost: currentCost,
            currentCost: currentCost,
            currentCapped: currentResult.capped,
            watchout: "No new credit product.",
            assumptions: "Uses your entered cards, loans, APRs, minimums, method, and extra monthly payment."
          }
        ];

        scenarios.forEach(function (scenario, index) {
          var model = scenario.bestModel || buildPayoffScenarioModel(scenario, cards, loans, payment, methodInput.value, customOrder, index);
          if (model.refinanced.amount <= EPSILON) {
            rows.push({
              name: scenario.name,
              unavailable: true,
              reason: "Enter an amount above $0 to model this option."
            });
            return;
          }
          var unusedText = scenario.extraAvailable > EPSILON
            ? " You entered " + money(scenario.extraAvailable) + " more available transfer/loan capacity than current card balances, so the cheapest offer order the calculator can model was applied."
            : "";
          var promoText = model.earliestPromoEnd != null && model.result.months > model.earliestPromoEnd
            ? " At least one balance-transfer promo can expire before payoff; post-promo APR may apply."
            : "";
          rows.push({
            type: scenario.type,
            name: scenario.name,
            amount: model.refinanced.amount,
            result: model.result,
            displayMonthlyPayment: model.offerMaxPayment,
            totalCost: model.totalCost,
            currentCost: currentCost,
            currentCapped: currentResult.capped,
            assumptions: "Applies the cheapest offer order the calculator can model: " + model.optionTerms.join("; ") + ".",
            watchout: (model.offerMaxPayment > currentMaxPayment + EPSILON ? "Required monthly payment can rise to " + money(model.offerMaxPayment) + ", which is higher than the current plan." : "Compare fees, promo expirations, and loan terms before applying.") + unusedText + promoText
          });
          renderOptionUsageSummary(scenario, model.allocation, model.result, cardTotal);
        });

        var availableRows = rows.filter(function (row) { return row.result && !row.result.capped; });
        var bestCost = availableRows.length ? Math.min.apply(null, availableRows.map(function (row) { return row.totalCost; })) : null;
        payoffOptionRows.innerHTML = rows.map(function (row) {
          return renderPayoffOptionRow(row, bestCost);
        }).join("");
        payoffOptionNote.textContent = scenarios.length
          ? "New offers start at your current card balance by default. The calculator tests offer combinations and applies the cheapest order it can model. Existing installment loans stay in the plan. Fees are counted in Interest + Fees."
          : "Add balance transfer or consolidation loan scenarios to compare them with the current plan.";
      }

      function renderSchedule(result) {
        var generation = ++scheduleRenderGeneration;
        var initialScheduleMonths = 12;
        var maxDisplayRows = showAllSchedule ? Math.min(result.timeline.length, 240) : Math.min(result.timeline.length, initialScheduleMonths);
        var rows = result.timeline.slice(0, maxDisplayRows);

        function scheduleRowHtml(row) {
          return "<tr>" +
            "<td>" + row.month + "</td>" +
            "<td>" + escapeHtml(addMonths(startInput.value, row.month - 1)) + "</td>" +
            "<td>" + moneyCents(row.payment) + "</td>" +
            "<td>" + moneyCents(row.interest) + "</td>" +
            "<td>" + moneyCents(row.principal) + "</td>" +
            "<td>" + moneyCents(row.endingBalance) + "</td>" +
            "<td>" + escapeHtml(row.target || "-") + "</td>" +
            "</tr>";
        }

        function renderRowsSynchronously(targetRows) {
          scheduleRows.innerHTML = targetRows.map(scheduleRowHtml).join("");
          scheduleNote.textContent = scheduleStatus(targetRows.length);
          scheduleLoading.classList.add("hidden");
        }

        function scheduleStatus(count) {
          var note = "Showing " + count + " of " + result.timeline.length + " months.";
          if (showAllSchedule && result.timeline.length > 240) {
            note += " Schedule capped at 20 years for display. Full payoff timeline shown in the results above.";
          }
          return note;
        }

        if (result.timeline.length > initialScheduleMonths) {
          toggleSchedule.classList.remove("hidden");
          toggleSchedule.textContent = showAllSchedule ? "Show First 12" : "Show All";
        } else {
          toggleSchedule.classList.add("hidden");
        }

        if (!showAllSchedule || rows.length <= initialScheduleMonths) {
          renderRowsSynchronously(rows);
          return;
        }

        scheduleRows.innerHTML = "";
        scheduleNote.textContent = scheduleStatus(0);
        scheduleLoading.classList.remove("hidden");

        var rendered = 0;
        function renderBatch() {
          if (generation !== scheduleRenderGeneration) return;
          var nextRows = rows.slice(rendered, rendered + 100);
          scheduleRows.insertAdjacentHTML("beforeend", nextRows.map(scheduleRowHtml).join(""));
          rendered += nextRows.length;
          scheduleNote.textContent = scheduleStatus(rendered);
          if (rendered < rows.length) {
            if (window.requestAnimationFrame) {
              window.requestAnimationFrame(renderBatch);
            } else {
              window.setTimeout(renderBatch, 0);
            }
          } else {
            scheduleLoading.classList.add("hidden");
          }
        }

        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(renderBatch);
        } else {
          window.setTimeout(renderBatch, 0);
        }
      }

      function renderFullScheduleForPrint() {
        if (!lastResult) return;
        scheduleRenderGeneration += 1;
        showAllSchedule = true;
        var rows = lastResult.timeline.slice();
        scheduleRows.innerHTML = rows.map(function (row) {
          return "<tr>" +
            "<td>" + row.month + "</td>" +
            "<td>" + escapeHtml(addMonths(startInput.value, row.month - 1)) + "</td>" +
            "<td>" + moneyCents(row.payment) + "</td>" +
            "<td>" + moneyCents(row.interest) + "</td>" +
            "<td>" + moneyCents(row.principal) + "</td>" +
            "<td>" + moneyCents(row.endingBalance) + "</td>" +
            "<td>" + escapeHtml(row.target || "-") + "</td>" +
            "</tr>";
        }).join("");
        scheduleNote.textContent = "Showing " + rows.length + " of " + lastResult.timeline.length + " months.";
        scheduleLoading.classList.add("hidden");
      }

      function prepareScheduleForPrint() {
        if (!printSchedulePrepared) {
          printPreviousShowAll = showAllSchedule;
          printSchedulePrepared = true;
        }
        renderFullScheduleForPrint();
      }

      // ── Charts ───────────────────────────────────────────────────────────
      var CHART_COLORS = [
        "#3b82f6","#f43f5e","#10b981","#f59e0b","#8b5cf6",
        "#ec4899","#06b6d4","#84cc16","#f97316","#6366f1",
        "#14b8a6","#e11d48","#a855f7","#22d3ee","#d97706",
        "#0ea5e9","#4ade80","#fb923c","#c084fc","#ef4444"
      ];

      var comboCanvas = document.getElementById("comboChart");
      var comboTooltip = document.getElementById("comboTooltip");
      var chartLegend = document.getElementById("chartLegend");
      var chartTakeaway = document.getElementById("chartTakeaway");

      function clearCharts() {
        if (comboCanvas && comboCanvas.getContext) {
          var ctx = comboCanvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, comboCanvas.width, comboCanvas.height);
          comboCanvas._lastSig = "";
          comboCanvas._chartData = null;
        }
        if (comboTooltip) comboTooltip.classList.add("hidden");
        if (chartLegend) chartLegend.innerHTML = "";
        if (chartTakeaway) {
          chartTakeaway.classList.add("hidden");
          chartTakeaway.textContent = "";
        }
      }

      function chartPad() { return { top: 24, right: 20, bottom: 68, left: 68 }; }

      function setCanvasSize(canvas, heightPx) {
        var rect = canvas.parentElement.getBoundingClientRect();
        var w = Math.max(200, rect.width);
        var h = heightPx || 360;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
      }

      function niceTickStep(range, maxTicks) {
        if (!range || range <= 0) return 1;
        var rough = range / maxTicks;
        var mag = Math.pow(10, Math.floor(Math.log10(rough)));
        var residual = rough / mag;
        var step = residual < 1.5 ? 1 : residual < 3 ? 2 : residual < 7 ? 5 : 10;
        return step * mag;
      }

      function fmtK(v) {
        if (v === 0) return "$0";
        if (v >= 1000) return "$" + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "k";
        return "$" + v;
      }

      function roundedTopRect(ctx, x, y, width, height, radius) {
        var r = Math.max(0, Math.min(radius, width / 2, height));
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, [r, r, 0, 0]);
          ctx.fill();
          return;
        }
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x, y + r);
        ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
        ctx.lineTo(x + width - r, y);
        ctx.arc(x + width - r, y + r, r, Math.PI * 1.5, 0);
        ctx.lineTo(x + width, y + height);
        ctx.closePath();
        ctx.fill();
      }

      function drawSampleChartWatermark(ctx, W, H, pad) {
        if (!isSampleMode) return;
        var centerX = pad.left + (W - pad.left - pad.right) / 2;
        var centerY = pad.top + (H - pad.top - pad.bottom) / 2;
        var fontSize = Math.max(34, Math.min(72, (W - pad.left - pad.right) / 8.5));
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-Math.PI / 9);
        ctx.font = "900 " + fontSize + "px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(15, 36, 68, 0.13)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
        ctx.lineWidth = Math.max(3, fontSize / 14);
        ctx.strokeText("Sample Data", 0, 0);
        ctx.fillText("Sample Data", 0, 0);
        ctx.restore();
      }

      function drawComboChart(result) {
        if (!comboCanvas || !comboCanvas.getContext) return;
        if (!result || !result.timeline || result.timeline.length === 0) return;
        var currentWidth = comboCanvas.parentElement ? comboCanvas.parentElement.getBoundingClientRect().width : 0;
        var midIdx = Math.floor(result.timeline.length / 2);
        var midBal = result.timeline[midIdx] ? result.timeline[midIdx].endingBalance : 0;
        var sig = result.timeline.length + "|" + result.method + "|" + result.startingBalance + "|" +
          (result.timeline[0] ? result.timeline[0].endingBalance : "") + "|" +
          midBal + "|" +
          (result.timeline[result.timeline.length - 1] ? result.timeline[result.timeline.length - 1].endingBalance : "") + "|" +
          (isSampleMode ? "sample" : "real") + "|" +
          startInput.value + "|" +
          currentWidth;
        if (sig === comboCanvas._lastSig) {
          return;
        }
        comboCanvas._lastSig = sig;
        setCanvasSize(comboCanvas, 360);
        var dpr = window.devicePixelRatio;
        var ctx = comboCanvas.getContext("2d");
        var W = comboCanvas.width / dpr;
        var H = comboCanvas.height / dpr;
        ctx.clearRect(0, 0, comboCanvas.width, comboCanvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);

        var timeline = result.timeline;
        var debtNames = result.debtNames || [];
        var numDebts = debtNames.length;

        if (!timeline || timeline.length === 0) { ctx.restore(); return; }

        var pad = chartPad();
        var innerW = W - pad.left - pad.right;
        var innerH = H - pad.top - pad.bottom;
        var maxBalance = Math.max(result.startingBalance, timeline.reduce(function (max, row) {
          return Math.max(max, Number(row.endingBalance || 0));
        }, 0));
        var months = timeline.length;

        ctx.fillStyle = "#fafcff";
        ctx.fillRect(pad.left, pad.top, innerW, innerH);

        // Build per-debt balance series (index 0 = month 0 starting, then month 1..N)
        // Month 0: starting balances from summaries
        var series = debtNames.map(function (_, di) {
          return [result.summaries[di] ? result.summaries[di].startingBalance : 0];
        });
        timeline.forEach(function (row) {
          debtNames.forEach(function (_, di) {
            series[di].push(row.balances && row.balances[di] != null ? Math.max(0, row.balances[di]) : 0);
          });
        });
        var totalPoints = months + 1; // 0..months

        function xPos(i) { return pad.left + (i / Math.max(1, totalPoints - 1)) * innerW; }
        function yPos(v) { return pad.top + innerH - (v / Math.max(1, maxBalance)) * innerH; }

        // Y gridlines
        var yStep = niceTickStep(maxBalance, 6);
        ctx.font = "11px system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        for (var yv = 0; yv <= maxBalance * 1.05; yv += yStep) {
          if (yv > maxBalance * 1.1) break;
          var yp = yPos(yv);
          ctx.strokeStyle = "#f0f4fa";
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(pad.left, yp); ctx.lineTo(W - pad.right, yp); ctx.stroke();
          ctx.fillStyle = "#667085";
          ctx.fillText(fmtK(Math.round(yv)), pad.left - 6, yp);
        }

        // X gridlines + labels
        var xStep = Math.max(1, niceTickStep(months, 7));
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        for (var mo = 0; mo <= months; mo += xStep) {
          var xp = xPos(mo);
          ctx.strokeStyle = "#f0f4fa";
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(xp, pad.top); ctx.lineTo(xp, pad.top + innerH); ctx.stroke();
          ctx.fillStyle = "#667085";
          ctx.save();
          ctx.translate(xp, pad.top + innerH + 12);
          ctx.rotate(-Math.PI / 6);
          ctx.textAlign = "right";
          ctx.fillText(chartAxisMonthLabel(mo), 0, 0);
          ctx.restore();
        }

        // Axes
        ctx.strokeStyle = "#c9d5e3";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + innerH); ctx.lineTo(W - pad.right, pad.top + innerH);
        ctx.stroke();

        // Stacked bars (bottom up: debt 0 at bottom, last at top)
        // Compute cumulative stacks per point
        var stacks = [];
        for (var i = 0; i < totalPoints; i++) {
          var cumul = [0];
          for (var di = 0; di < numDebts; di++) {
            cumul.push(cumul[di] + (series[di][i] || 0));
          }
          stacks.push(cumul);
        }

        var pointGap = innerW / Math.max(1, totalPoints - 1);
        var barWidth = Math.max(1, Math.min(18, pointGap * 0.72 * 0.85) - 2);

        for (var i = 0; i < totalPoints; i++) {
          var xp = xPos(i);
          var barX = Math.max(pad.left, Math.min(W - pad.right - barWidth, xp - barWidth / 2));
          for (var di = 0; di < numDebts; di++) {
            var segment = series[di][i] || 0;
            if (segment <= 0) continue;
            var topY = yPos(stacks[i][di + 1]);
            var bottomY = yPos(stacks[i][di]);
            ctx.fillStyle = CHART_COLORS[di % CHART_COLORS.length];
            roundedTopRect(ctx, barX, topY, barWidth, Math.max(1, bottomY - topY), Math.min(4, barWidth / 2));
          }
        }

        // Total balance line overlay (dark)
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(result.startingBalance));
        timeline.forEach(function (row, i) {
          ctx.lineTo(xPos(i + 1), yPos(Math.max(0, row.endingBalance)));
        });
        ctx.strokeStyle = "#0f2444";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.setLineDash([]);
        ctx.stroke();

        drawSampleChartWatermark(ctx, W, H, pad);

        ctx.restore();

        // Legend
        if (chartLegend) {
          chartLegend.innerHTML =
            '<span class="legend-item"><span class="legend-swatch" style="background:#0f2444;height:3px;border-radius:2px"></span>Total Balance</span>' +
            debtNames.map(function (name, di) {
              return '<span class="legend-item"><span class="legend-swatch" style="background:' + CHART_COLORS[di % CHART_COLORS.length] + '"></span>' + escapeHtml(name) + '</span>';
            }).join("");
        }

        // Store for tooltip
        comboCanvas._chartData = { result: result, pad: pad, W: W, H: H, totalPoints: totalPoints, xPos: xPos, yPos: yPos, stacks: stacks };
      }

      // Combo chart tooltip
      if (comboCanvas) {
        comboCanvas.addEventListener("mousemove", function (e) {
          showComboTooltip(e.clientX);
        });

        comboCanvas.addEventListener("touchmove", function (e) {
          if (!e.touches || !e.touches.length) return;
          showComboTooltip(e.touches[0].clientX);
        }, { passive: true });
      }

      function showComboTooltip(clientX) {
        if (!comboCanvas || !comboTooltip) return;
        var data = comboCanvas._chartData;
        if (!data) { comboTooltip.classList.add("hidden"); return; }
        var rect = comboCanvas.getBoundingClientRect();
        var mouseX = clientX - rect.left;
        var pad = data.pad;
        var innerW = data.W - pad.left - pad.right;
        var months = data.result.timeline.length;
        if (mouseX < pad.left || mouseX > data.W - pad.right) { comboTooltip.classList.add("hidden"); return; }
        var fraction = (mouseX - pad.left) / innerW;
        var monthIdx = Math.round(fraction * months) - 1;
        if (monthIdx < 0) monthIdx = 0;
        if (monthIdx >= months) monthIdx = months - 1;
        var row = data.result.timeline[monthIdx];
        if (!row) { comboTooltip.classList.add("hidden"); return; }
        comboTooltip.classList.remove("hidden");
        comboTooltip.style.left = Math.min(mouseX + 12, rect.width - 160) + "px";
        comboTooltip.style.top = "8px";
        var lines = [resultMonthLabel(row.month) + ": " + money(row.endingBalance) + " total"];
        if (row.balances) {
          data.result.debtNames.forEach(function (name, di) {
            var bal = row.balances[di] != null ? row.balances[di] : 0;
            lines.push((name || "Debt " + (di+1)) + ": " + money(bal));
          });
        }
        comboTooltip.innerHTML = lines.map(function (l, i) { return (i === 0 ? "<strong>" + escapeHtml(l) + "</strong>" : escapeHtml(l)); }).join("<br>");
      }

      if (comboCanvas && comboTooltip) {
        comboCanvas.addEventListener("mouseleave", function () {
          comboTooltip.classList.add("hidden");
        });

        comboCanvas.addEventListener("touchend", function () {
          comboTooltip.classList.add("hidden");
        });
      }

      function drawCharts(result) {
        drawComboChart(result);
        renderChartTakeaway(result);
      }

      function renderChartTakeaway(result) {
        if (!chartTakeaway || !result || !result.timeline || !result.timeline.length) return;
        chartTakeaway.textContent = chartTakeawayText(result, startInput.value);
        chartTakeaway.classList.remove("hidden");
      }

      function chartTakeawayText(result, startMonth) {
        var firstPayoff = (result.summaries || []).filter(function (summary) {
          return summary.payoffMonth !== null;
        }).sort(function (a, b) {
          return a.payoffMonth - b.payoffMonth;
        })[0];
        var payoffDate = result.capped ? "50+ years" : addMonths(startMonth, result.months - 1);
        var firstText = firstPayoff ? firstPayoff.name + " is first paid off around " + addMonths(startMonth, firstPayoff.payoffMonth - 1) : "No individual payoff appears in the modeled window";
        return "Chart takeaway: balance starts at " + money(result.startingBalance) + ", reaches " + (result.capped ? "the 50-year model limit" : "$0 by " + payoffDate) + ", and " + firstText + ".";
      }

      window.addEventListener("resize", function () {
        if (lastResult) drawCharts(lastResult);
        updateMobileSummaryContext();
      });
      window.addEventListener("scroll", updateMobileSummaryContext, { passive: true });

      // ── Main update ───────────────────────────────────────────────────────
      function setError(message) {
        if (!message) {
          formError.classList.add("hidden");
          formError.textContent = "";
          return;
        }
        formError.classList.remove("hidden");
        formError.textContent = message;
      }

      function hideMobileSummary() {
        mobileSummaryBar.classList.add("hidden");
      }

      function isEditableField(element) {
        return Boolean(element && element.matches && element.matches("input, select, textarea"));
      }

      function isInputFocused() {
        return isEditableField(document.activeElement);
      }

      function handleEditableFocus(event) {
        if (isEditableField(event.target)) {
          document.body.classList.add("input-focused");
          hideMobileSummary();
        }
      }

      function syncInputFocusState() {
        if (isInputFocused()) {
          document.body.classList.add("input-focused");
          hideMobileSummary();
          return;
        }
        document.body.classList.remove("input-focused");
        if (lastResult) updateMobileSummary(lastResult);
      }

      function scheduleInputFocusSync() {
        setTimeout(syncInputFocusState, 0);
      }

      function updateMobileSummaryContext() {
        if (!mobileSummaryBar || !mobileSummaryLink || mobileSummaryBar.classList.contains("hidden")) return;
        if (!window.matchMedia || !window.matchMedia("(max-width: 640px)").matches) return;
        var resultsRect = resultsPanel ? resultsPanel.getBoundingClientRect() : null;
        var optionsRect = payoffOptions ? payoffOptions.getBoundingClientRect() : null;
        if (payoffOptions && optionsRect && optionsRect.top < window.innerHeight * 0.72 && optionsRect.bottom > 90) {
          mobileSummaryLink.textContent = "Edit options ↓";
          mobileSummaryLink.setAttribute("href", "#payoffOptions");
          return;
        }
        if (resultsRect && resultsRect.top < 80 && resultsRect.bottom > 140) {
          mobileSummaryLink.textContent = "Edit debts ↑";
          mobileSummaryLink.setAttribute("href", "#calculatorForm");
          return;
        }
        mobileSummaryLink.textContent = "View full payoff plan ↓";
        mobileSummaryLink.setAttribute("href", "#resultsPanel");
      }

      function updateMobileSummary(result) {
        if (!result || isSampleMode || isInputFocused()) {
          hideMobileSummary();
          return;
        }
        mobilePayoffDate.textContent = result.capped ? "50+ years" : addMonths(startInput.value, result.months - 1);
        mobileTotalInterest.textContent = result.capped ? "Still accruing after 50 years" : money(result.totalInterest) + " interest";
        mobileMonthlyPayment.textContent = "Payment " + money(result.monthlyPayment) + "/mo";
        mobileSummaryBar.classList.remove("hidden");
        updateMobileSummaryContext();
      }

      function scheduleUpdate() {
        if (updateTimer) clearTimeout(updateTimer);
        updateTimer = setTimeout(update, 80);
      }

      function renderResultExplainer(cards, loans, result, baseline, comparisonResults, payment) {
        var insights = [];
        var avalanche = findResultByMethod(comparisonResults, "avalanche") ||
          simulateWithPaymentPlan(cards, loans, payment, "avalanche");
        var snowball = findResultByMethod(comparisonResults, "snowball") ||
          simulateWithPaymentPlan(cards, loans, payment, "snowball");
        var allRates = cards.map(function (card) { return Number(card.apr || 0); })
          .concat(loans.map(function (loan) { return Number(loan.rate || 0); }));
        var highestApr = allRates.length ? Math.max.apply(null, allRates) : 0;
        var hasPromo = cards.some(function (card) {
          return card.introApr !== null && card.introMonths !== null && card.introMonths > 0;
        });

        if (hasPromo) {
          insights.push("One or more cards have a promo rate — after the promo expires, interest will accelerate.");
        }

        if (highestApr > 25) {
          insights.push("Your highest APR is " + highestApr.toFixed(2).replace(/\.00$/, "") + "% — avalanche targets this first to minimize interest.");
        }

        if (!avalanche.capped && !snowball.capped) {
          var avalancheSavings = roundCents(snowball.totalInterest - avalanche.totalInterest);
          if (avalancheSavings > 200) {
            insights.push("Avalanche saves " + money(avalancheSavings) + " over snowball for this debt mix.");
          } else if (Math.abs(avalancheSavings) <= 50) {
            insights.push("Avalanche and snowball produce similar results here — consider snowball for faster early wins.");
          }
        }

        if (!baseline.capped && !result.capped && baseline.months - result.months > 60) {
          insights.push("Minimum-only payments would take " + (baseline.months - result.months) + " more months — extra payment makes a big difference.");
        }

        if (!insights.length) {
          resultExplainer.classList.add("hidden");
          resultExplainer.textContent = "";
          return;
        }

        resultExplainer.textContent = insights.slice(0, 2).join(" ");
        resultExplainer.classList.remove("hidden");
      }

      function showFirstRunHint() {
        try {
          if (sessionStorage.getItem("hintDismissed") === "1") return;
        } catch (error) {}
        firstRunHint.classList.add("hidden");
        sampleDataBanner.classList.remove("hidden");
      }

      function dismissFirstRunHint() {
        firstRunHint.classList.add("hidden");
        sampleDataBanner.classList.add("hidden");
        try {
          sessionStorage.setItem("hintDismissed", "1");
        } catch (error) {}
      }

      function isValidMonthValue(value) {
        return /^\d{4}-\d{2}$/.test(String(value || ""));
      }

      function cleanSharedNumber(value, min, max) {
        var number = Number(value);
        if (!Number.isFinite(number) || number < min || number > max) return null;
        return Math.round(number * 100) / 100;
      }

      function cleanSharedName(value) {
        return String(value || "").replace(/\s+/g, " ").trim().slice(0, 60);
      }

      function encodeSharedState(state) {
        var json = JSON.stringify(state);
        return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }

      function decodeSharedState(value) {
        try {
          var base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
          while (base64.length % 4) base64 += "=";
          return JSON.parse(decodeURIComponent(escape(atob(base64))));
        } catch (error) {
          return null;
        }
      }

      function sharedCard(card, index) {
        var item = {
          id: card.id || "card-" + (index + 1),
          name: cleanSharedName(card.name),
          balance: cleanSharedNumber(card.balance, 0, Number.MAX_SAFE_INTEGER),
          apr: cleanSharedNumber(card.apr, 0, MAX_APR),
          minimum: cleanSharedNumber(card.minimum, 0, Number.MAX_SAFE_INTEGER)
        };
        if (!item.name) delete item.name;
        if (card.introApr != null && card.introMonths != null) {
          item.introApr = cleanSharedNumber(card.introApr, 0, MAX_APR);
          item.introMonths = Math.round(Number(card.introMonths));
        }
        return item;
      }

      function sharedLoan(loan, index) {
        return {
          id: loan.id || "loan-" + (index + 1),
          balance: cleanSharedNumber(loan.balance, 0, Number.MAX_SAFE_INTEGER),
          rate: cleanSharedNumber(loan.rate, 0, MAX_APR),
          payment: cleanSharedNumber(loan.payment, 0, Number.MAX_SAFE_INTEGER),
          term: loan.term == null ? null : Math.round(Number(loan.term))
        };
      }

      function sharedOptionScenario(scenario) {
        var type = scenario.dataset.optionType;
        var amount = getOptionField(scenario, "amount");
        if (type === "balance-transfer") {
          var postApr = getOptionField(scenario, "postApr");
          return {
            type: type,
            amount: amount === "" ? null : cleanSharedNumber(optionNumberValue(amount, 0, 0, Number.MAX_SAFE_INTEGER), 0, Number.MAX_SAFE_INTEGER),
            fee: cleanSharedNumber(optionNumberValue(getOptionField(scenario, "fee"), 3, 0, 20), 0, 20),
            introApr: cleanSharedNumber(optionNumberValue(getOptionField(scenario, "introApr"), 0, 0, MAX_APR), 0, MAX_APR),
            introMonths: Math.round(optionNumberValue(getOptionField(scenario, "introMonths"), 18, MIN_INTRO_MONTHS, MAX_INTRO_MONTHS)),
            postApr: postApr === "" ? null : cleanSharedNumber(optionNumberValue(postApr, 0, 0, MAX_APR), 0, MAX_APR)
          };
        }
        if (type === "consolidation-loan") {
          return {
            type: type,
            amount: amount === "" ? null : cleanSharedNumber(optionNumberValue(amount, 0, 0, Number.MAX_SAFE_INTEGER), 0, Number.MAX_SAFE_INTEGER),
            apr: cleanSharedNumber(optionNumberValue(getOptionField(scenario, "apr"), 12.99, 0, MAX_APR), 0, MAX_APR),
            term: Math.round(optionNumberValue(getOptionField(scenario, "term"), 36, 1, 360)),
            fee: cleanSharedNumber(optionNumberValue(getOptionField(scenario, "fee"), 3, 0, 20), 0, 20)
          };
        }
        return null;
      }

      function sharedOptionScenarios() {
        if (!optionScenarioList) return [];
        return Array.prototype.slice.call(optionScenarioList.querySelectorAll(".option-fieldset"))
          .slice(0, MAX_PAYOFF_OPTIONS)
          .map(sharedOptionScenario)
          .filter(Boolean);
      }

      function updateSharedUrl(cards, loans, method, extraPayment, mode, enteredAmount) {
        try {
          if (!window.history || !window.history.replaceState || !window.URL) return;
          var url = new URL(window.location.href);
          var state = {
            v: 1,
            method: method,
            extraPayment: cleanSharedNumber(extraPayment, 0, Number.MAX_SAFE_INTEGER) || 0,
            paymentMode: mode === "total" ? "total" : "extra",
            paymentAmount: cleanSharedNumber(enteredAmount, 0, Number.MAX_SAFE_INTEGER),
            startMonth: isValidMonthValue(startInput.value) ? startInput.value : "",
            targetMonth: isValidMonthValue(targetInput.value) ? targetInput.value : "",
            cards: cards.map(sharedCard),
            loans: (loans || []).map(sharedLoan),
            optionScenarios: sharedOptionScenarios(),
            customOrder: customOrder.slice(0, 60)
          };
          url.searchParams.set("q", encodeSharedState(state));
          window.history.replaceState(null, "", url.toString());
        } catch (error) {}
      }

      function clearSharedUrlParam() {
        try {
          if (!window.history || !window.history.replaceState || !window.URL) return;
          var url = new URL(window.location.href);
          url.searchParams.delete("q");
          window.history.replaceState(null, "", url.toString());
        } catch (error) {}
      }

      function loadSharedState() {
        var params;
        try {
          params = new URLSearchParams(window.location.search);
        } catch (error) {
          return false;
        }
        var encoded = params.get("q");
        if (!encoded) return false;

        var state = decodeSharedState(encoded);
        if (!state || state.v !== 1) {
          clearSharedUrlParam();
          return false;
        }

        var cards = Array.isArray(state.cards) ? state.cards.slice(0, MAX_CARDS).map(function (card, index) {
          var item = sharedCard(card || {}, index);
          item.name = cleanSharedName(card && card.name) || "Card " + (index + 1);
          if (!item.balance || item.apr === null || !item.minimum) return null;
          if (item.introApr === null || !Number.isInteger(item.introMonths) || item.introMonths < MIN_INTRO_MONTHS || item.introMonths > MAX_INTRO_MONTHS) {
            delete item.introApr;
            delete item.introMonths;
          }
          return item;
        }).filter(Boolean) : [];
        var loans = Array.isArray(state.loans) ? state.loans.map(function (loan, index) {
          var item = sharedLoan(loan || {}, index);
          item.name = "Loan " + (index + 1);
          if (!item.balance || item.rate === null || !item.payment) return null;
          if (item.term != null && (!Number.isFinite(item.term) || item.term < 1)) item.term = null;
          return item;
        }).filter(Boolean) : [];
        var optionScenarios = Array.isArray(state.optionScenarios) ? state.optionScenarios.slice(0, MAX_PAYOFF_OPTIONS).map(function (scenario) {
          if (!scenario) return null;
          if (scenario.type === "balance-transfer") {
            return {
              type: "balance-transfer",
              amount: scenario.amount == null ? null : optionNumberValue(scenario.amount, 0, 0, Number.MAX_SAFE_INTEGER),
              fee: optionNumberValue(scenario.fee, 3, 0, 20),
              introApr: optionNumberValue(scenario.introApr, 0, 0, MAX_APR),
              introMonths: Math.round(optionNumberValue(scenario.introMonths, 18, MIN_INTRO_MONTHS, MAX_INTRO_MONTHS)),
              postApr: scenario.postApr == null ? null : optionNumberValue(scenario.postApr, 0, 0, MAX_APR)
            };
          }
          if (scenario.type === "consolidation-loan") {
            return {
              type: "consolidation-loan",
              amount: scenario.amount == null ? null : optionNumberValue(scenario.amount, 0, 0, Number.MAX_SAFE_INTEGER),
              apr: optionNumberValue(scenario.apr, 12.99, 0, MAX_APR),
              term: Math.round(optionNumberValue(scenario.term, 36, 1, 360)),
              fee: optionNumberValue(scenario.fee, 3, 0, 20)
            };
          }
          return null;
        }).filter(Boolean) : null;

        if (!cards.length && !loans.length) {
          clearSharedUrlParam();
          return false;
        }

        cardRows.innerHTML = "";
        loanRows.innerHTML = "";
        nextId = 1;
        loanNextId = 1;
        customOrder = [];
        cards.forEach(addCardRow);
        loans.forEach(addLoanRow);
        optionScenarioList.innerHTML = "";
        optionScenarioNextId = 1;
        if (optionScenarios) {
          optionScenarios.forEach(function (scenario) {
            addOptionScenario(scenario.type, scenario);
          });
        }
        updateOptionScenarioLimitState();
        methodInput.value = ["avalanche", "snowball", "minimum", "custom"].indexOf(state.method) !== -1 ? state.method : "avalanche";
        paymentModeInput.value = state.paymentMode === "total" ? "total" : "extra";
        extraInput.value = cleanSharedNumber(state.paymentAmount != null ? state.paymentAmount : state.extraPayment, 0, Number.MAX_SAFE_INTEGER) || 0;
        syncPaymentInputCopy();
        startInput.value = isValidMonthValue(state.startMonth) ? state.startMonth : currentMonthValue();
        targetInput.value = isValidMonthValue(state.targetMonth) ? state.targetMonth : "";
        if (Array.isArray(state.customOrder)) {
          customOrder = state.customOrder.filter(function (id) {
            return typeof id === "string";
          }).slice(0, 60);
        }
        setSampleMode(false);
        updateAddButton();
        update({ skipTracking: true, skipUrlUpdate: true });
        return true;
      }

      function trackingPayoffOptions(cards) {
        var cardTotal = roundCents(sumCardBalances(cards));
        if (cardTotal <= EPSILON) return [];
        var averageApr = weightedCardApr(cards);
        return readPayoffOptionScenarios(averageApr, cardTotal).map(function (scenario, index) {
          var item = {
            index: index + 1,
            type: scenario.type,
            amount: scenario.amount,
            entries: (scenario.entries || []).map(function (entry) {
              return {
                type: entry.type,
                amount: entry.amount,
                feeRate: entry.feeRate,
                introApr: entry.introApr,
                introMonths: entry.introMonths,
                postApr: entry.postApr,
                apr: entry.apr,
                termMonths: entry.term
              };
            })
          };
          return item;
        });
      }

      function trackingInputState(cards, loans, options) {
        return {
          version: 1,
          method: options.method || "avalanche",
          paymentMode: options.paymentMode === "total" ? "total" : "extra",
          paymentAmount: cleanSharedNumber(options.paymentAmount, 0, Number.MAX_SAFE_INTEGER),
          extraPayment: cleanSharedNumber(options.extraPayment, 0, Number.MAX_SAFE_INTEGER) || 0,
          startMonth: isValidMonthValue(options.startMonth) ? options.startMonth : "",
          targetMonth: isValidMonthValue(options.targetDate) ? options.targetDate : "",
          customOrder: customOrder.slice(0, 60),
          cards: cards.map(function (card, index) {
            var item = {
              id: card.id || "card-" + (index + 1),
              index: index + 1,
              balance: card.balance,
              apr: card.apr,
              minimum: card.minimum
            };
            if (card.introApr != null && card.introMonths != null) {
              item.introApr = card.introApr;
              item.introMonths = card.introMonths;
            }
            return item;
          }),
          loans: (loans || []).map(function (loan, index) {
            return {
              id: loan.id || "loan-" + (index + 1),
              index: index + 1,
              balance: loan.balance,
              apr: loan.apr != null ? loan.apr : loan.rate,
              payment: loan.payment,
              termMonths: loan.termMonths || loan.term || null,
              type: loan.type || "loan"
            };
          }),
          payoffOptions: trackingPayoffOptions(cards)
        };
      }

      function buildOfferCustomOrder(baseOrder, remainingCards, newDebtIds, replacedCardIds) {
        var remainingCardIds = (remainingCards || []).map(function (card) { return card.id; });
        var replacements = newDebtIds || [];
        var replaced = replacedCardIds || [];
        var output = [];
        var inserted = false;
        function pushUnique(id) {
          if (id && output.indexOf(id) === -1) output.push(id);
        }
        (baseOrder || []).forEach(function (id) {
          var wasReplaced = replaced.indexOf(id) !== -1;
          if (!wasReplaced || remainingCardIds.indexOf(id) !== -1) pushUnique(id);
          if (wasReplaced && !inserted) {
            replacements.forEach(pushUnique);
            inserted = true;
          }
        });
        if (!inserted) replacements.forEach(pushUnique);
        return output;
      }

      function payoffOptionTelemetryEnabled() {
        try {
          return PAYOFF_OPTION_TELEMETRY_ENABLED ||
            localStorage.getItem("cpoc_payoff_option_telemetry_enabled") === "1";
        } catch (error) {
          return PAYOFF_OPTION_TELEMETRY_ENABLED;
        }
      }

      function postCalculationPayload(payload) {
        function post(body) {
          return fetch(SUPABASE_URL + '/rest/v1/calculations', {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(body)
          });
        }

        var body = payload;
        if (!payoffOptionTelemetryEnabled()) {
          body = {};
          Object.keys(payload).forEach(function (key) {
            if ([
              "payoff_options",
              "num_payoff_options",
              "num_balance_transfer_options",
              "num_consolidation_loan_options"
            ].indexOf(key) === -1) {
              body[key] = payload[key];
            }
          });
        }

        return post(body);
      }

      function trackCalculation(cards, loans, options, result) {
        if (telemetryDisabled()) return;
        try {
          var uid = getUid();
          var payoffOptionData = trackingPayoffOptions(cards);
          var balanceTransferOptionCount = payoffOptionData.reduce(function (count, option) {
            return count + (option.entries || []).filter(function (entry) { return entry.type === "balance-transfer"; }).length;
          }, 0);
          var consolidationLoanOptionCount = payoffOptionData.reduce(function (count, option) {
            return count + (option.entries || []).filter(function (entry) { return entry.type === "consolidation-loan"; }).length;
          }, 0);

          var payload = {
            uid: uid,
            target_month: options.targetDate || null,
            months_to_payoff: result.months || null,
            total_interest: result.totalInterest != null ? Math.round(result.totalInterest * 100) / 100 : null,
            input_state: trackingInputState(cards, loans, options),
            payoff_options: payoffOptionData,
            num_payoff_options: payoffOptionData.length,
            num_balance_transfer_options: balanceTransferOptionCount,
            num_consolidation_loan_options: consolidationLoanOptionCount
          };

          postCalculationPayload(payload).catch(function () {});
        } catch (e) {}
      }

      function update(options) {
        options = options || {};
        clearFieldErrors();
        var cards = readCards();
        var loans = readLoans();
        var onlyZeroBalances = !cards.length && !loans.length && hasOnlyZeroBalanceEntries();
        var error = onlyZeroBalances ? "" : validateCards(cards, loans);
        if (!error && !onlyZeroBalances) error = validateLoans(loans);
        var method = methodInput.value;
        var extraValue = Number(extraInput.value || 0);
        if (!error && !onlyZeroBalances && (!Number.isFinite(extraValue) || extraValue < 0)) {
          setControlError(extraInput, "extraPayment", "Enter $0 or more.");
          error = "Enter a payment amount of $0 or more.";
        }

        methodDescription.textContent = methodHelp(method);
        renderCustomOrderPanel(cards, loans, method);

        if (error) {
          setError(error);
          hideCalculatedResults(DEFAULT_EMPTY_MESSAGE);
          return;
        }

        if (onlyZeroBalances) {
          setError("");
          hideCalculatedResults(ZERO_BALANCE_MESSAGE);
          if (!options.skipUrlUpdate) {
            clearSharedUrlParam();
          }
          return;
        }

        setError("");
        emptyResults.textContent = DEFAULT_EMPTY_MESSAGE;
        emptyResults.classList.add("hidden");
        resultsContent.classList.remove("hidden");

        var payment = currentPaymentInput(cards, loans, method);
        if (payment.mode === "total" && method !== "minimum" && payment.enteredAmount + EPSILON < payment.minimum) {
          setControlError(extraInput, "extraPayment", "Budget must be at least " + money(payment.minimum) + " to cover starting minimums.");
          setError("Total monthly payoff budget must be at least " + money(payment.minimum) + " to cover starting minimums.");
          hideCalculatedResults(DEFAULT_EMPTY_MESSAGE);
          return;
        }
        var extra = payment.extraPayment;
        var result = simulate(cards, payment.mode === "total"
          ? { method: method, monthlyBudget: payment.monthlyBudget, customOrder: customOrder.slice() }
          : { method: method, extraPayment: extra, customOrder: customOrder.slice() }, loans);
        var baseline = simulate(cards, { method: "minimum", extraPayment: 0 }, loans);
        lastResult = result;
        setCopySummaryAvailable(true);
        updateMobilePayoffJump(Boolean(result), isSampleMode ? "View sample payoff plan" : "View payoff plan");

        totalBalanceEl.textContent = money(result.startingBalance);
        totalMinimumsEl.textContent = money(result.startingMinimumTotal);
        if (result.capped) {
          payoffDateEl.innerHTML = '<span class="limit-badge">⚠️ 50-year limit reached</span>';
          payoffSuggestion.classList.remove("hidden");
        } else {
          payoffDateEl.textContent = addMonths(startInput.value, result.months - 1);
          payoffSuggestion.classList.add("hidden");
        }
        payoffMonthsEl.textContent = duration(result.months, result.capped);
        totalInterestLabel.textContent = resultInterestLabel(result);
        totalInterestEl.textContent = resultInterestText(result);
        monthlyPaymentEl.textContent = money(result.monthlyPayment);
        totalPaidLabel.textContent = resultPaidLabel(result);
        totalPaidEl.textContent = resultPaidText(result);
        firstTargetEl.textContent = result.timeline[0] ? (result.timeline[0].target || "-") : "-";
        renderCurrentPlanSummary(result);
        updateMobileSummary(result);

        var warnings = result.warnings.slice();
        if (method === "minimum" && result.capped) {
          warnings.unshift("Minimum-only payments do not pay off this debt within the calculator limit. Add extra payment or use avalanche/snowball.");
        }
        renderCriticalWarnings(result.criticalWarnings || []);
        renderWarnings(warnings);
        var comparisonResults = renderComparison(cards, loans, payment, result, baseline);
        renderDecisionSnapshot(comparisonResults, result);
        renderMethodRecommendation(cards, loans, payment, comparisonResults);
        renderPayoffOptions(cards, loans, result, payment);
        renderTarget(cards, loans, method);
        renderSavings(result, baseline, extra);
        renderMonthPlan(result);
        renderSchedule(result);
        drawCharts(result);
        if (!options.skipUrlUpdate) {
          updateSharedUrl(cards, loans, method, extra, payment.mode, payment.enteredAmount);
        }
        renderResultExplainer(cards, loans, result, baseline, comparisonResults, payment);
        if (!options.skipTracking && !isSampleMode) {
          trackCalculation(cards, loans, {
            method: method,
            extraPayment: extra,
            targetDate: targetInput ? targetInput.value : null,
            startMonth: startInput ? startInput.value : null,
            paymentMode: payment.mode,
            paymentAmount: payment.enteredAmount
          }, result);
        }
      }

      function loadSample(options) {
        var settings = options || {};
        setSampleMode(true);
        setPlanModeStatus("");
        cardRows.innerHTML = "";
        loanRows.innerHTML = "";
        nextId = 1;
        loanNextId = 1;
        customOrder = [];
        showAllSchedule = false;
        [
          { name: "Sample Visa", balance: 8500, apr: 22.99, minimum: 170 },
          { name: "Sample Store Card", balance: 1200, apr: 28.99, minimum: 45 },
          { name: "Sample Mastercard", balance: 3200, apr: 19.99, minimum: 64 }
        ].forEach(addCardRow);
        methodInput.value = "avalanche";
        paymentModeInput.value = "extra";
        extraInput.value = "250";
        syncPaymentInputCopy();
        startInput.value = currentMonthValue();
        targetInput.value = "";
        resetDefaultOptionScenarios();
        updateAddButton();
        showFirstRunHint();
        update({ skipTracking: true, skipUrlUpdate: Boolean(settings.skipUrlUpdate) });
        setSampleMode(true);
      }

      function focusFirstCardField(field) {
        var input = cardRows.querySelector('[data-field="' + field + '"]') || cardRows.querySelector("input");
        if (input) {
          try {
            input.focus({ preventScroll: true });
          } catch (error) {
            input.focus();
          }
        }
      }

      function loadBlankEntry(options) {
        var settings = options || {};
        setSampleMode(false);
        setPlanModeStatus(settings.status || "");
        cardRows.innerHTML = "";
        loanRows.innerHTML = "";
        nextId = 1;
        loanNextId = 1;
        customOrder = [];
        showAllSchedule = false;
        addCardRow({ name: "", balance: "", apr: "", minimum: "" }, { expandOnMobile: true });
        methodInput.value = "avalanche";
        paymentModeInput.value = "extra";
        extraInput.value = "0";
        syncPaymentInputCopy();
        startInput.value = currentMonthValue();
        targetInput.value = "";
        resetDefaultOptionScenarios();
        updateAddButton();
        setError("");
        dismissFirstRunHint();
        hideCalculatedResults(DEFAULT_EMPTY_MESSAGE);
        if (!settings.keepUrl) clearSharedUrlParam();
        if (settings.focus) {
          setTimeout(function () { focusFirstCardField(settings.focusField || "name"); }, 0);
        }
      }

      if (typeof window !== "undefined") {
        window.CardPayoffLiveMath = {
          roundCents: roundCents,
          normalizeCards: normalizeCards,
          normalizeLoans: normalizeLoans,
          startingMinimumTotal: startingMinimumTotal,
          simulate: simulate,
          requiredPaymentForTarget: requiredPaymentForTarget,
          loanPaymentForTerm: loanPaymentForTerm,
          loanTermWarning: loanTermWarning,
          refinanceCardsByAmount: refinanceCardsByAmount,
          optionSortRate: optionSortRate,
          optionModeledCostScore: optionModeledCostScore,
          optionActualCostScore: optionActualCostScore,
          optionSavingsPerDollar: optionSavingsPerDollar,
          optionCapacityValue: optionCapacityValue,
          maxPayoffOptions: MAX_PAYOFF_OPTIONS,
          cleanSharedName: cleanSharedName,
          sharedCard: sharedCard,
          scorePayoffScenarioEntries: scorePayoffScenarioEntries,
          optimizePayoffScenarioOrder: optimizePayoffScenarioOrder,
          buildPayoffScenarioModel: buildPayoffScenarioModel,
          optionDifferenceText: optionDifferenceText,
          optionCostLabel: optionCostLabel,
          optionCostText: optionCostText,
          comparisonInterestText: comparisonInterestText,
          resultInterestLabel: resultInterestLabel,
          resultInterestText: resultInterestText,
          resultPaidLabel: resultPaidLabel,
          resultPaidText: resultPaidText,
          buildResultsSummary: buildResultsSummary,
          savingsMessage: savingsMessage,
          methodRecommendationMessage: methodRecommendationMessage,
          decisionDeltaText: decisionDeltaText,
          chartAxisMonthLabel: chartAxisMonthLabel,
          maxTimelinePayment: maxTimelinePayment,
          simulateWithPaymentPlan: simulateWithPaymentPlan,
          buildOfferCustomOrder: buildOfferCustomOrder,
          chartTakeawayText: chartTakeawayText
        };
        if (window.CP_TEST_MODE) return;
      }

      bind(cardRows, "input", function (event) {
        var editedRow = event.target ? event.target.closest("tr") : null;
        if (isSampleMode) exitSampleForOwnPlan(editedRow);
        else markRowUpdated(editedRow);
        if (!sampleDataBanner.classList.contains("hidden")) sampleDataBanner.classList.add("hidden");
        scheduleUpdate();
      });
      bind(optionScenarioList, "input", function (event) {
        exitSampleForOwnPlan(null);
        if (event.target && event.target.dataset && event.target.dataset.optionField === "amount") {
          event.target.dataset.optionAutoDefault = "false";
        }
        scheduleUpdate();
      });
      bind(payoffOptions, "click", function (event) {
        var button = event.target.closest("button[data-action]");
        if (!button) return;
        if (button.dataset.action === "add-balance-transfer") {
          if (isSampleMode) {
            exitSampleForOwnPlan(null);
          }
          var balanceTransferScenario = addOptionScenario("balance-transfer");
          update();
          if (balanceTransferScenario) {
            var balanceTransferInput = balanceTransferScenario.querySelector("input");
            if (balanceTransferInput) balanceTransferInput.focus();
          }
          return;
        }
        if (button.dataset.action === "add-consolidation-loan") {
          if (isSampleMode) {
            exitSampleForOwnPlan(null);
          }
          var consolidationScenario = addOptionScenario("consolidation-loan");
          update();
          if (consolidationScenario) {
            var consolidationInput = consolidationScenario.querySelector("input");
            if (consolidationInput) consolidationInput.focus();
          }
          return;
        }
        if (button.dataset.action === "remove-option-scenario") {
          var scenario = button.closest(".option-fieldset");
          if (scenario) scenario.remove();
          updateOptionScenarioLimitState();
          update();
        }
      });
      bind(cardRows, "click", function (event) {
        var rowToggle = event.target.closest("button[data-action='toggle-card-row'], .card-summary-line");
        if (rowToggle) {
          var toggleRow = rowToggle.closest("tr");
          if (toggleRow) {
            toggleRow.classList.toggle("expanded");
            updateCardSummary(toggleRow);
          }
          return;
        }

        var button = event.target.closest("button[data-action='remove']");
        if (button) {
          exitSampleForOwnPlan(button.closest("tr"));
          var row = button.closest("tr");
          if (row) {
            customOrder = customOrder.filter(function (id) { return id !== row.dataset.id; });
            row.remove();
          }
          updateAddButton();
          update();
          return;
        }
        // Intro rate toggle
        var toggleBtn = event.target.closest("button[data-action='toggle-intro']");
        if (toggleBtn) {
          var introDiv = toggleBtn.closest("td").querySelector(".intro-fields");
          var expanded = toggleBtn.getAttribute("aria-expanded") === "true";
          if (introDiv) introDiv.classList.toggle("hidden", expanded);
          toggleBtn.setAttribute("aria-expanded", String(!expanded));
          toggleBtn.textContent = expanded ? "Add promo APR" : "Hide promo APR";
        }
      });

      bind(loanRows, "input", function () {
        exitSampleForOwnPlan(null);
        scheduleUpdate();
      });
      bind(loanRows, "click", function (event) {
        var button = event.target.closest("button[data-action='remove-loan']");
        if (!button) return;
        exitSampleForOwnPlan(null);
        var row = button.closest("tr");
        if (row) {
          customOrder = customOrder.filter(function (id) { return id !== row.dataset.id; });
          row.remove();
        }
        update();
      });

      bind(customOrderPanel, "click", function (event) {
        var button = event.target.closest("button[data-action='custom-up'], button[data-action='custom-down']");
        if (!button) return;
        var item = button.closest(".custom-order-item");
        if (!item) return;
        var index = customOrder.indexOf(item.dataset.id);
        if (index === -1) return;
        var direction = button.dataset.action === "custom-up" ? -1 : 1;
        var nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= customOrder.length) return;
        var moved = customOrder[index];
        customOrder[index] = customOrder[nextIndex];
        customOrder[nextIndex] = moved;
        update();
      });

      bind(addCardButton, "click", function () {
        exitSampleForOwnPlan(null);
        addCardRow(null, { expandOnMobile: true });
        update();
      });

      bind(addLoanButton, "click", function () {
        exitSampleForOwnPlan(null);
        addLoanRow();
        update();
      });

      bind(sampleButton, "click", function () {
        loadSample();
      });
      bind(clearAllButton, "click", function () {
        loadBlankEntry({ focus: true, focusField: "name" });
      });

      function replaceSampleWithCards() {
        loadBlankEntry({ focus: true, focusField: "name", status: "You're entering your own cards now. Add balance, APR, and minimum payment to see your payoff plan." });
        if (calculatorForm) calculatorForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      bind(enterCardsButton, "click", replaceSampleWithCards);
      bind(resultEnterCardsButton, "click", replaceSampleWithCards);
      bind(sampleEnterCardsButton, "click", replaceSampleWithCards);
      bind(keepSampleButton, "click", confirmSampleData);
      bind(boostExtraButton, "click", function () {
        if (isSampleMode) {
          showSampleActionRequired("Replace sample data before trying a higher extra payment on your own plan.");
          return;
        }
        var current = Number(extraInput.value || 0);
        extraInput.value = String(Math.max(0, (Number.isFinite(current) ? current : 0) + 50));
        if (methodInput.value === "minimum") methodInput.value = "avalanche";
        syncPaymentInputCopy();
        update();
        try {
          extraInput.focus({ preventScroll: true });
        } catch (error) {
          extraInput.focus();
        }
      });
      syncTelemetryOptOutControl();
      bind(telemetryOptOut, "change", function () {
        setTelemetryOptOut(telemetryOptOut.checked);
        syncTelemetryOptOutControl();
      });

      document.addEventListener("focus", handleEditableFocus, true);
      document.addEventListener("focusin", handleEditableFocus);
      document.addEventListener("pointerdown", handleEditableFocus, true);
      document.addEventListener("click", function (event) {
        if (isEditableField(event.target)) {
          handleEditableFocus(event);
          return;
        }
        scheduleInputFocusSync();
      }, true);
      document.addEventListener("focusout", function () {
        scheduleInputFocusSync();
      });
      bind(calculatorForm, "submit", function (event) {
        event.preventDefault();
        update();
      });
      bind(calculatorForm, "keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          update();
        }
      });
      bindLoadExampleButton();

      [methodInput, paymentModeInput, extraInput, startInput, targetInput].forEach(function (input) {
        bind(input, "input", function () {
          exitSampleForOwnPlan(null);
          if (input === paymentModeInput) syncPaymentInputCopy();
          scheduleUpdate();
        });
        bind(input, "change", function () {
          if (input === paymentModeInput) syncPaymentInputCopy();
          update();
        });
      });

      bind(dismissHint, "click", dismissFirstRunHint);

      bind(toggleSchedule, "click", function () {
        showAllSchedule = !showAllSchedule;
        if (lastResult) renderSchedule(lastResult);
      });

      bind(printButton, "click", function () {
        prepareScheduleForPrint();
        window.print();
      });

      bind(copyLinkButton, "click", copyShareLink);
      bind(copySummaryButton, "click", copyResultsSummary);
      bind(reportIssueButton, "click", openFeedbackDialog);
      bind(feedbackForm, "submit", submitFeedbackReport);
      bind(feedbackCancelButton, "click", closeFeedbackDialog);
      bind(feedbackCancelSecondaryButton, "click", closeFeedbackDialog);
      bind(feedbackDialog, "click", function (event) {
        if (event.target === feedbackDialog) closeFeedbackDialog();
      });
      syncPaymentInputCopy();

      window.addEventListener("beforeprint", function () {
        prepareScheduleForPrint();
      });

      window.addEventListener("afterprint", function () {
        showAllSchedule = printPreviousShowAll;
        printSchedulePrepared = false;
        if (lastResult) renderSchedule(lastResult);
      });

      startInput.value = currentMonthValue();
      resetDefaultOptionScenarios();
      if (!loadSharedState()) {
        loadBlankEntry({ keepUrl: true });
      }
      if (window.location.hash && document.getElementById("deferredContentTemplate") && document.getElementById("deferredContentTemplate").content.querySelector(window.location.hash)) {
        mountDeferredContent();
      } else {
        scheduleIdle(mountDeferredContent);
      }
    })();
