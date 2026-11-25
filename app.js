(function () {
  'use strict';

  const BASE_MONTH_REVENUE = 47500000;
  const BASE_DAILY_ORDERS = 11;

  const STATUS_FLOW = {
    pending: {
      next: 'packing',
      label: 'Chờ xác nhận',
      cls: 'status-pending'
    },
    packing: {
      next: 'done',
      label: 'Đang đóng gói',
      cls: 'status-packing'
    },
    done: {
      next: 'pending',
      label: 'Hoàn thành',
      cls: 'status-done'
    }
  };

  const state = {
    activeMode: 'admin',
    orders: [
      {
        id: 'FB-1084',
        customer: 'Minh Anh',
        item: 'Set Joie Quần Ống Suông',
        variant: 'Ballet Blush · Size S',
        amount: 890000,
        payLabel: 'Đã thanh toán VietQR',
        status: 'packing'
      },
      {
        id: 'FB-1083',
        customer: 'Thảo Vy',
        item: 'Đầm Golf Cổ Polo',
        variant: 'Obsidian Noir · Size M',
        amount: 1090000,
        payLabel: 'COD khi nhận hàng',
        status: 'pending'
      },
      {
        id: 'FB-1082',
        customer: 'Khánh Linh',
        item: 'Set Chaebol Bolero & Bra',
        variant: 'Espresso · Size S',
        amount: 950000,
        payLabel: 'Đã thanh toán VietQR',
        status: 'pending'
      },
      {
        id: 'FB-1081',
        customer: 'Ngọc Hân',
        item: 'Set Golf Tiểu Thư Len Kem',
        variant: 'Butter Ivory · Size M',
        amount: 1150000,
        payLabel: 'Đã thanh toán VietQR',
        status: 'done'
      }
    ],
    skus: [
      {
        id: 'SKU-JOIE-S',
        name: 'Set Joie Quần Ống Suông',
        colorName: 'Ballet Blush',
        colorHex: '#E5A4B3',
        size: 'S',
        stock: 12,
        image: './assets/pilates-blush.jpg'
      },
      {
        id: 'SKU-CHAEBOL-S',
        name: 'Set Chaebol Bolero & Bra',
        colorName: 'Espresso',
        colorHex: '#3E231B',
        size: 'S',
        stock: 9,
        image: './assets/active-espresso.jpg'
      },
      {
        id: 'SKU-GOLF-M',
        name: 'Set Golf Tiểu Thư Len Kem',
        colorName: 'Butter Ivory',
        colorHex: '#EFE0C4',
        size: 'M',
        stock: 2,
        image: './assets/golf-ivory.jpg'
      },
      {
        id: 'SKU-HALTER-S',
        name: 'Set Halter Lưng Trần',
        colorName: 'Glacier Blue',
        colorHex: '#95C0E8',
        size: 'S',
        stock: 0,
        image: './assets/hero-atelier.jpg'
      }
    ]
  };

  function formatVnd(val) {
    return `${Number(val || 0).toLocaleString('vi-VN')}₫`;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 2400);
  }

  function renderKpis() {
    const grid = document.getElementById('kpi-grid');
    if (!grid) return;

    const doneRevenue = state.orders
      .filter((o) => o.status === 'done')
      .reduce((s, o) => s + o.amount, 0);
    const totalRevenue = BASE_MONTH_REVENUE + doneRevenue;

    const todayOrders = BASE_DAILY_ORDERS + state.orders.length;
    const paidVietQr = state.orders.filter((o) => o.payLabel.includes('VietQR')).length;
    const vietQrPct = Math.round(((10 + paidVietQr) / todayOrders) * 100);
    const lowStockCount = state.skus.filter((sku) => sku.stock <= 3).length;

    grid.innerHTML = `
      <div class="kpi-card">
        <span class="kpi-label">Doanh thu tháng</span>
        <span class="kpi-value accent-rose">${formatVnd(totalRevenue)}</span>
        <span class="kpi-sub">Tự cộng khi đơn Hoàn thành</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Đơn đồng bộ hôm nay</span>
        <span class="kpi-value">${todayOrders} đơn</span>
        <span class="kpi-sub">${state.orders.filter((o) => o.status === 'pending').length} đơn chờ xác nhận</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Khớp lệnh VietQR tự động</span>
        <span class="kpi-value accent-emerald">${vietQrPct}%</span>
        <span class="kpi-sub">Xác nhận tiền về trong 3 giây</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Cảnh báo sắp hết size</span>
        <span class="kpi-value accent-amber">${lowStockCount} mẫu</span>
        <span class="kpi-sub">Biến thể còn &le; 3 sản phẩm</span>
      </div>
    `;
  }

  function renderOrders() {
    const container = document.getElementById('order-list');
    if (!container) return;

    container.innerHTML = state.orders
      .map((order) => {
        const meta = STATUS_FLOW[order.status] || STATUS_FLOW.pending;
        return `
          <div class="order-row">
            <div class="order-main">
              <strong>#${escapeHtml(order.id)} · ${escapeHtml(order.customer)}</strong>
              <span class="order-meta">
                ${escapeHtml(order.item)} (${escapeHtml(order.variant)}) · ${escapeHtml(order.payLabel)}
              </span>
            </div>
            <div class="order-right">
              <span class="order-amount">${formatVnd(order.amount)}</span>
              <button type="button" class="status-btn ${meta.cls}" data-cycle-order="${escapeHtml(order.id)}">
                ${escapeHtml(meta.label)} ↻
              </button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function getStockBadgeMeta(stock) {
    if (stock <= 0) return { cls: 'stock-out', text: 'Hết hàng: 0' };
    if (stock <= 3) return { cls: 'stock-low', text: `Sắp hết: ${stock}` };
    return { cls: 'stock-ok', text: `Còn ${stock}` };
  }

  function renderSkus() {
    const container = document.getElementById('sku-list');
    if (!container) return;

    container.innerHTML = state.skus
      .map((sku) => {
        const badge = getStockBadgeMeta(sku.stock);
        return `
          <div class="sku-row">
            <img src="${escapeHtml(sku.image)}" alt="${escapeHtml(sku.name)}" class="sku-thumb" />
            <div>
              <span class="sku-name">${escapeHtml(sku.name)}</span>
              <span class="sku-variant">
                <i class="sku-dot" style="background: ${escapeHtml(sku.colorHex)};"></i>
                ${escapeHtml(sku.colorName)} · Size ${escapeHtml(sku.size)}
              </span>
            </div>
            <div class="sku-controls">
              <span class="stock-badge ${badge.cls}">${escapeHtml(badge.text)}</span>
              <div class="qty-stepper">
                <button type="button" class="qty-btn" data-sku-step="${escapeHtml(sku.id)}:-1" aria-label="Giảm tồn kho">−</button>
                <span class="qty-num">${sku.stock}</span>
                <button type="button" class="qty-btn" data-sku-step="${escapeHtml(sku.id)}:1" aria-label="Tăng tồn kho">+</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function switchMode(mode) {
    state.activeMode = mode === 'storefront' ? 'storefront' : 'admin';
    document.querySelectorAll('[data-mode-tab]').forEach((tab) => {
      const isMatch = tab.dataset.modeTab === state.activeMode;
      tab.classList.toggle('active', isMatch);
      tab.setAttribute('aria-selected', String(isMatch));
    });
    document.getElementById('panel-admin')?.classList.toggle('active', state.activeMode === 'admin');
    document.getElementById('panel-storefront')?.classList.toggle('active', state.activeMode === 'storefront');
  }

  function exportCsv() {
    const headers = ['Ma_SKU', 'Ten_San_Pham', 'Mau_Sac', 'Size', 'Ton_Kho'];
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = state.skus.map((s) =>
      [s.id, s.name, s.colorName, s.size, s.stock].map(escapeCsv).join(',')
    );
    const orderHeaders = ['', 'Ma_Don', 'Khach_Hang', 'San_Pham', 'Gia_Tri', 'Trang_Thai'];
    const orderRows = state.orders.map((o) =>
      ['', o.id, o.customer, `${o.item} (${o.variant})`, o.amount, STATUS_FLOW[o.status].label]
        .map(escapeCsv)
        .join(',')
    );

    const csv =
      '\uFEFF' +
      [headers.map(escapeCsv).join(','), ...rows, '', orderHeaders.map(escapeCsv).join(','), ...orderRows].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wyanz-studio-bao-cao-kho-don.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file CSV Doanh thu & Tồn kho!');
  }

  function bindEvents() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a[data-switch-tab], [data-mode-tab]');
      if (!target) return;

      if (target.dataset.modeTab) {
        switchMode(target.dataset.modeTab);
        return;
      }

      if (target.dataset.switchTab) {
        switchMode(target.dataset.switchTab);
        document.getElementById('live-system-demo')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (target.dataset.cycleOrder) {
        const order = state.orders.find((o) => o.id === target.dataset.cycleOrder);
        if (!order) return;
        const currMeta = STATUS_FLOW[order.status] || STATUS_FLOW.pending;
        order.status = currMeta.next;
        const nextMeta = STATUS_FLOW[order.status];
        renderKpis();
        renderOrders();
        showToast(`Đơn #${order.id} chuyển sang: ${nextMeta.label}`);
        return;
      }

      if (target.dataset.skuStep) {
        const [skuId, deltaStr] = target.dataset.skuStep.split(':');
        const sku = state.skus.find((s) => s.id === skuId);
        if (!sku) return;
        sku.stock = Math.max(0, sku.stock + Number(deltaStr));
        renderKpis();
        renderSkus();
        showToast(`Đã cập nhật tồn kho ${sku.name} (${sku.size}): ${sku.stock}`);
        return;
      }

      if (target.id === 'export-csv-btn') {
        exportCsv();
      }
    });
  }

  renderKpis();
  renderOrders();
  renderSkus();
  switchMode('admin');
  bindEvents();
})();
