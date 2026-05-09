const USERS = ["大鸟", "司徒", "alex", "老鹰", "梧桐", "皮老弟", "JC", "秋旋", "叶婷", "毛老师"];
const PASSWORDS = Object.fromEntries(USERS.map((name) => [name, "yyds8888"]));
const STORAGE_KEY = "a-money-ledger-v1";
const SESSION_KEY = "a-money-session-v1";
const ALL_USERS_OPTION = "__ALL_USERS__";
const WUTONG_BATCH_DATE = "2026-05-09 22:00";
const SITOU_BATCH_DATE = "2026-05-09 22:20";

const seedEntries = [...buildWutongExpenseEntries(), ...buildSitouExpenseEntries()];

let state = {
  currentUser: sessionStorage.getItem(SESSION_KEY) || "",
  selectedUser: sessionStorage.getItem(SESSION_KEY) || USERS[0],
  settlementMode: "payable",
  entries: loadEntries(),
};

const elements = {
  loginView: document.querySelector("#loginView"),
  dashboardView: document.querySelector("#dashboardView"),
  loginForm: document.querySelector("#loginForm"),
  loginName: document.querySelector("#loginName"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  currentUserText: document.querySelector("#currentUserText"),
  logoutButton: document.querySelector("#logoutButton"),
  totalReceivable: document.querySelector("#totalReceivable"),
  totalPayable: document.querySelector("#totalPayable"),
  entryCount: document.querySelector("#entryCount"),
  userTabs: document.querySelector("#userTabs"),
  settlementMode: document.querySelector("#settlementMode"),
  payerSummaryText: document.querySelector("#payerSummaryText"),
  payerTotal: document.querySelector("#payerTotal"),
  settlementList: document.querySelector("#settlementList"),
  selectedUserName: document.querySelector("#selectedUserName"),
  balanceBadge: document.querySelector("#balanceBadge"),
  selectedReceivable: document.querySelector("#selectedReceivable"),
  selectedPayable: document.querySelector("#selectedPayable"),
  selectedBalance: document.querySelector("#selectedBalance"),
  entryForm: document.querySelector("#entryForm"),
  entryNotice: document.querySelector("#entryNotice"),
  toUser: document.querySelector("#toUser"),
  amount: document.querySelector("#amount"),
  note: document.querySelector("#note"),
  receivableList: document.querySelector("#receivableList"),
  payableList: document.querySelector("#payableList"),
};

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;",
    }[character];
  });
}

function createSeedEntry(key, to, amount, note) {
  return {
    id: `seed-wutong-${key}-${to}`,
    from: "梧桐",
    to,
    amount,
    note,
    createdAt: WUTONG_BATCH_DATE,
  };
}

function createSharedSeedEntries(key, total, note) {
  const perPersonAmount = total / USERS.length;
  return USERS
    .filter((name) => name !== "梧桐")
    .map((name) => createSeedEntry(key, name, perPersonAmount, `${note}（10人均分）`));
}

function createSitouSeedEntry(key, to, amount, note) {
  return {
    id: `seed-sitou-${key}-${to}`,
    from: "司徒",
    to,
    amount,
    note,
    createdAt: SITOU_BATCH_DATE,
  };
}

function createSitouSharedSeedEntries(key, total, note) {
  const perPersonAmount = total / USERS.length;
  return USERS
    .filter((name) => name !== "司徒")
    .map((name) => createSitouSeedEntry(key, name, perPersonAmount, `${note}（10人均分）`));
}

function buildWutongExpenseEntries() {
  const sharedEntries = [
    ...createSharedSeedEntries("convenience-781thb", 165, "便利店781泰铢"),
    ...createSharedSeedEntries("electricity-2100thb", 445, "电费2100泰铢"),
    ...createSharedSeedEntries("room", 7593, "房费"),
  ];

  const directEntries = [
    createSeedEntry("taxi-airport", "老鹰", 225, "打车去机场"),
    createSeedEntry("cash-2000thb", "大鸟", 422, "现金2000泰铢"),
    createSeedEntry("cash-1000thb", "司徒", 211, "现金1000泰铢"),
    createSeedEntry("nana-drinks", "alex", 257, "NaNa drink+lady drink"),
    ...["大鸟", "叶婷", "司徒", "秋旋"].map((name) => createSeedEntry("nana-72", name, 72, "NaNa")),
    ...["JC", "毛老师"].map((name) => createSeedEntry("nana-lady-chivas", name, 282, "NaNa+lady drink+chivas")),
    ...["老鹰", "皮老弟"].map((name) => createSeedEntry("nana-situ-happy-split", name, 1407, "NaNa dirnk+司徒 happy")),
  ];

  return [...sharedEntries, ...directEntries];
}

function buildSitouExpenseEntries() {
  const sharedEntries = [
    ...createSitouSharedSeedEntries("cash-2800thb", 591, "2800泰铢"),
    ...createSitouSharedSeedEntries("seaside-restaurant", 650, "海边餐厅"),
    ...createSitouSharedSeedEntries("cash-900thb", 190, "900泰铢"),
  ];

  const directEntries = ["秋旋", "毛老师", "皮老弟"].map((name) => createSitouSeedEntry("durian", name, 45, "榴莲"));

  return [...sharedEntries, ...directEntries];
}

function mergeSeedEntries(entries) {
  const migratedEntries = entries.map((entry) => {
    if (entry.id === "seed-wutong-nana-situ-happy-split-老鹰" || entry.id === "seed-wutong-nana-situ-happy-split-皮老弟") {
      return {
        ...entry,
        amount: 1407,
        note: "NaNa dirnk+司徒 happy",
      };
    }

    return entry;
  });
  const existingIds = new Set(migratedEntries.map((entry) => entry.id));
  const missingSeedEntries = seedEntries.filter((entry) => !existingIds.has(entry.id));
  return [...missingSeedEntries, ...migratedEntries];
}

function loadEntries() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
    return seedEntries;
  }

  try {
    const parsed = JSON.parse(saved);
    const entries = Array.isArray(parsed) ? parsed : seedEntries;
    const mergedEntries = mergeSeedEntries(entries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedEntries));
    return mergedEntries;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
    return seedEntries;
  }
}

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatNow() {
  const now = new Date();
  const date = now.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll("/", "-");
  const time = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time}`;
}

function getStats(userName) {
  const receivable = state.entries
    .filter((entry) => entry.from === userName)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const payable = state.entries
    .filter((entry) => entry.to === userName)
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    receivable,
    payable,
    balance: receivable - payable,
  };
}

function populateSelect(selectElement, names) {
  selectElement.innerHTML = names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
}

function populatePersonSelect(selectElement, names) {
  const options = [
    `<option value="${ALL_USERS_OPTION}">所有人</option>`,
    ...names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`),
  ];

  selectElement.innerHTML = options.join("");
}

function getEntryGroupKey(entry) {
  if (entry.groupId) return entry.groupId;

  const seedOwnerPrefix = entry.id.startsWith("seed-wutong-") ? "seed-wutong-" : entry.id.startsWith("seed-sitou-") ? "seed-sitou-" : "";
  if (seedOwnerPrefix && entry.id.endsWith(`-${entry.to}`)) {
    return entry.id.slice(0, -entry.to.length - 1);
  }

  return `${entry.from}|${entry.note}|${entry.createdAt}`;
}

function groupEntriesByProject(entries) {
  const groups = new Map();

  entries.forEach((entry) => {
    const groupKey = getEntryGroupKey(entry);
    const current = groups.get(groupKey) || {
      id: groupKey,
      from: entry.from,
      note: entry.note,
      createdAt: entry.createdAt,
      total: 0,
      entries: [],
    };

    current.total += entry.amount;
    current.entries.push(entry);
    groups.set(groupKey, current);
  });

  return [...groups.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function renderShell() {
  const isLoggedIn = Boolean(state.currentUser);
  elements.loginView.classList.toggle("hidden", isLoggedIn);
  elements.dashboardView.classList.toggle("hidden", !isLoggedIn);

  if (!isLoggedIn) return;

  elements.currentUserText.textContent = `${state.currentUser} 已登录`;
  renderTabs();
  renderDashboard();
}

function renderTabs() {
  elements.userTabs.innerHTML = USERS.map((name) => {
    const activeClass = name === state.selectedUser ? "active" : "";
    return `<button class="${activeClass}" type="button" data-user="${escapeHtml(name)}">${escapeHtml(name)}</button>`;
  }).join("");
}

function renderDashboard() {
  const selected = getStats(state.selectedUser);
  const totalReceivable = state.entries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPayable = totalReceivable;
  const toOptions = USERS.filter((name) => name !== state.selectedUser);
  const canEditSelected = state.currentUser === "梧桐";

  elements.totalReceivable.textContent = formatCurrency(totalReceivable);
  elements.totalPayable.textContent = formatCurrency(totalPayable);
  elements.entryCount.textContent = `${state.entries.length} 笔`;
  elements.selectedUserName.textContent = state.selectedUser;
  elements.selectedReceivable.textContent = formatCurrency(selected.receivable);
  elements.selectedPayable.textContent = formatCurrency(selected.payable);
  elements.selectedBalance.textContent = formatCurrency(selected.balance);
  elements.balanceBadge.textContent = selected.balance >= 0 ? "净应收" : "净应付";
  elements.balanceBadge.classList.toggle("negative", selected.balance < 0);
  elements.entryNotice.textContent = canEditSelected ? "" : "当前为查看模式，只有梧桐可以修改明细数据。";
  elements.toUser.disabled = !canEditSelected;
  elements.amount.disabled = !canEditSelected;
  elements.note.disabled = !canEditSelected;
  elements.entryForm.querySelector("button[type='submit']").disabled = !canEditSelected;

  populatePersonSelect(elements.toUser, toOptions);
  renderEntryLists();
  renderSettlementSummary();
}

function getPairwiseSettlements(personName) {
  return USERS
    .filter((name) => name !== personName)
    .map((counterpart) => {
      const payableEntries = state.entries.filter((entry) => entry.from === counterpart && entry.to === personName);
      const receivableEntries = state.entries.filter((entry) => entry.from === personName && entry.to === counterpart);
      const payable = payableEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const receivable = receivableEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const net = payable - receivable;

      return {
        counterpart,
        payable,
        receivable,
        offset: Math.min(payable, receivable),
        net,
        payableEntries,
        receivableEntries,
      };
    })
    .filter((item) => item.payable > 0 || item.receivable > 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

function renderSettlementSummary() {
  const settlements = getPairwiseSettlements(state.selectedUser);
  const totalPayable = settlements
    .filter((item) => item.net > 0)
    .reduce((sum, item) => sum + item.net, 0);
  const totalReceivable = settlements
    .filter((item) => item.net < 0)
    .reduce((sum, item) => sum + Math.abs(item.net), 0);

  elements.settlementMode.value = state.settlementMode;
  elements.payerSummaryText.textContent = `${state.selectedUser} 抵消后${state.settlementMode === "payable" ? "应付" : "应收"}`;
  elements.payerTotal.textContent = state.settlementMode === "payable" ? formatCurrency(totalPayable) : formatCurrency(totalReceivable);

  const visibleSettlements = settlements.filter((item) => {
    return state.settlementMode === "payable" ? item.net > 0 : item.net < 0;
  });

  if (!visibleSettlements.length) {
    elements.settlementList.innerHTML = `<div class="empty-state">暂无结算汇总</div>`;
    return;
  }

  elements.settlementList.innerHTML = visibleSettlements.map((item) => {
    const direction = item.net > 0 ? `给 ${escapeHtml(item.counterpart)}` : `${escapeHtml(item.counterpart)} 给 ${escapeHtml(state.selectedUser)}`;
    const finalAmount = Math.abs(item.net);
    const cardClass = item.net < 0 ? "settlement-card receive" : "settlement-card";
    const payableNotes = item.payableEntries
      .map((entry) => `<span>应付 ${formatCurrency(entry.amount)} · ${escapeHtml(entry.note)}</span>`)
      .join("");
    const receivableNotes = item.receivableEntries
      .map((entry) => `<span>可抵 ${formatCurrency(entry.amount)} · ${escapeHtml(entry.note)}</span>`)
      .join("");
    const notes = [payableNotes, receivableNotes].filter(Boolean).join("");

    return `
      <article class="${cardClass}">
        <div class="settlement-card-header">
          <h3>${direction}</h3>
          <strong>${formatCurrency(finalAmount)}</strong>
        </div>
        <div class="settlement-breakdown">
          <div><span>${state.selectedUser} 原本应付 ${item.counterpart}</span><strong>${formatCurrency(item.payable)}</strong></div>
          <div><span>${item.counterpart} 原本应付 ${state.selectedUser}</span><strong>${formatCurrency(item.receivable)}</strong></div>
          <div><span>抵消金额</span><strong>${formatCurrency(item.offset)}</strong></div>
        </div>
        <div class="settlement-notes">${notes}</div>
      </article>
    `;
  }).join("");
}

function renderEntryLists() {
  const receivables = state.entries.filter((entry) => entry.from === state.selectedUser);
  const payables = state.entries.filter((entry) => entry.to === state.selectedUser);

  elements.receivableList.innerHTML = renderReceivableGroups(receivables);
  elements.payableList.innerHTML = renderEntries(payables, "from");
}

function renderReceivableGroups(entries) {
  if (!entries.length) {
    return `<div class="empty-state">暂无明细</div>`;
  }

  return groupEntriesByProject(entries).map((group) => {
    const canDelete = state.currentUser === "梧桐";
    const detailRows = group.entries
      .sort((a, b) => a.to.localeCompare(b.to, "zh-CN"))
      .map((entry) => `
        <div class="group-detail-row">
          <span>应收 ${escapeHtml(entry.to)}</span>
          <strong>${formatCurrency(entry.amount)}</strong>
        </div>
      `)
      .join("");

    return `
      <details class="entry-card group-card">
        <summary>
          <div class="entry-main">
            <span>${escapeHtml(group.note)}</span>
            <strong>${formatCurrency(group.total)}</strong>
          </div>
          <div class="entry-meta">
            <span>${group.createdAt} · ${group.entries.length} 人</span>
            ${canDelete ? `<button class="delete-button" type="button" data-delete-group="${escapeHtml(group.id)}" aria-label="删除">×</button>` : ""}
          </div>
        </summary>
        <div class="group-details">${detailRows}</div>
      </details>
    `;
  }).join("");
}

function renderEntries(entries, direction) {
  if (!entries.length) {
    return `<div class="empty-state">暂无明细</div>`;
  }

  return entries.map((entry) => {
    const counterpart = direction === "to" ? `应收 ${escapeHtml(entry.to)}` : `应付 ${escapeHtml(entry.from)}`;
    const canDelete = state.currentUser === "梧桐";

    return `
      <article class="entry-card">
        <div class="entry-main">
          <span>${counterpart}</span>
          <strong>${formatCurrency(entry.amount)}</strong>
        </div>
        <div>${escapeHtml(entry.note)}</div>
        <div class="entry-meta">
          <span>${entry.createdAt}</span>
          ${canDelete ? `<button class="delete-button" type="button" data-delete="${entry.id}" aria-label="删除">×</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function handleLogin(event) {
  event.preventDefault();
  const name = elements.loginName.value;
  const password = elements.loginPassword.value;

  if (PASSWORDS[name] !== password) {
    elements.loginError.textContent = "用户名或密码不对";
    return;
  }

  state.currentUser = name;
  state.selectedUser = name;
  sessionStorage.setItem(SESSION_KEY, name);
  elements.loginPassword.value = "";
  elements.loginError.textContent = "";
  renderShell();
}

function handleEntrySubmit(event) {
  event.preventDefault();

  if (state.currentUser !== "梧桐") return;

  const amount = Number(elements.amount.value);
  const note = elements.note.value.trim();

  if (!amount || amount <= 0 || !note) return;
  const selectedToUser = elements.toUser.value;
  const createdAt = formatNow();
  const groupId = createId();

  if (selectedToUser === ALL_USERS_OPTION) {
    const perPersonAmount = amount / USERS.length;
    const sharedEntries = USERS
      .filter((name) => name !== state.selectedUser)
      .map((name) => ({
        id: createId(),
        groupId,
        from: state.selectedUser,
        to: name,
        amount: perPersonAmount,
        note: `${note}（10人均分）`,
        createdAt,
      }));

    state.entries.unshift(...sharedEntries);
  } else {
    state.entries.unshift({
      id: createId(),
      groupId,
      from: state.selectedUser,
      to: selectedToUser,
      amount,
      note,
      createdAt,
    });
  }

  persistEntries();
  elements.entryForm.reset();
  renderDashboard();
}

function deleteEntry(id) {
  state.entries = state.entries.filter((entry) => entry.id !== id);
  persistEntries();
  renderDashboard();
}

function deleteEntryGroup(groupId) {
  state.entries = state.entries.filter((entry) => getEntryGroupKey(entry) !== groupId);
  persistEntries();
  renderDashboard();
}

function wireEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutButton.addEventListener("click", () => {
    state.currentUser = "";
    sessionStorage.removeItem(SESSION_KEY);
    renderShell();
  });

  elements.userTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-user]");
    if (!button) return;
    state.selectedUser = button.dataset.user;
    renderTabs();
    renderDashboard();
  });

  elements.settlementMode.addEventListener("change", () => {
    state.settlementMode = elements.settlementMode.value;
    renderSettlementSummary();
  });

  elements.entryForm.addEventListener("submit", handleEntrySubmit);

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-delete]");
    if (!button) return;
    deleteEntry(button.dataset.delete);
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-delete-group]");
    if (!button) return;
    event.preventDefault();
    deleteEntryGroup(button.dataset.deleteGroup);
  });

}

populateSelect(elements.loginName, USERS);
wireEvents();
renderShell();
