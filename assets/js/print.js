(() => {
	const qs = (s, el = document) => el.querySelector(s);
	const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
	const form = qs('#printForm');
	const postsListEl = qs('#postsList');
	const postsSelectEl = qs('#postsSelect');
	const postSearchEl = qs('#postSearch');
	const root = qs('#print-root');
	const buildBtn = qs('#buildPreview');
	const printBtn = qs('#printNow');
	const shareBtn = qs('#shareConfig');
	const colorEstimateEl = qs('#colorEstimate');

	if (!form || !root) return;

	let postsIndex = [];
	let htmlCache = new Map();

	function getConfig() {
		const data = new FormData(form);
		const cfg = Object.fromEntries(data.entries());
		// Canonical content: always include everything
		cfg.includeCover = true;
		cfg.includeForeword = true;
		cfg.includePosts = true;
		cfg.includeBack = true;
		cfg.pageSize = cfg.pageSize || 'A5';
		cfg.orientation = 'landscape';
		cfg.margin = Math.max(5, parseInt(cfg.margin || '12', 10));
		cfg.columns = parseInt(cfg.columns || '1', 10);
		cfg.colorMode = cfg.colorMode || 'color';
		cfg.roundedCorners = data.get('roundedCorners') === 'on';
		cfg.cropMarks = data.get('cropMarks') === 'on';
		cfg.orderMode = 'order';
		cfg.pageBreakBeforeTitles = data.get('pageBreakBeforeTitles') === 'on';
		cfg.duplex = data.get('duplex') === 'on';
		cfg.selectedSlugs = [];
		return cfg;
	}

	function applyRootClasses(cfg) {
		root.className = 'print-root';
		if (cfg.colorMode === 'bw') root.classList.add('print-bw');
		if (cfg.columns === 2) root.classList.add('columns-2');
		if (cfg.roundedCorners) root.classList.add('rounded');
		if (cfg.cropMarks) root.classList.add('crop');
		if (cfg.pageBreakBeforeTitles) root.classList.add('break-before');
		root.style.setProperty('--page-margin', cfg.margin + 'mm');
		// Update @page via a dynamic style
		ensureDynamicPageRule(cfg.pageSize, cfg.orientation);
	}

	let dynamicStyleEl;
	function ensureDynamicPageRule(size, orientation) {
		if (!dynamicStyleEl) {
			dynamicStyleEl = document.createElement('style');
			document.head.appendChild(dynamicStyleEl);
		}
		dynamicStyleEl.textContent = `@media print { @page { size: ${size} ${orientation}; margin: 0; } }`;
	}

	function toQuery(cfg) {
		const params = new URLSearchParams();
		for (const [k, v] of Object.entries(cfg)) {
			if (k === 'selectedSlugs') continue;
			params.set(k, String(v));
		}
		return params.toString();
	}

	function fromQuery() {
		const u = new URL(location.href);
		const p = u.searchParams;
		const applyVal = (name, v) => { const el = qs(`[name="${name}"]`); if (el) el.value = v; };
		if (p.size === 0) return;
		applyVal('pageSize', p.get('pageSize') || 'A5');
		applyVal('margin', p.get('margin') || '12');
		applyVal('columns', p.get('columns') || '1');
		applyVal('colorMode', p.get('colorMode') || 'color');
		if (p.get('pageBreakBeforeTitles') === 'false') {
			const el = qs('input[name="pageBreakBeforeTitles"]'); if (el) el.checked = false;
		}
	}

	async function loadPostsIndex() {
		try {
			const res = await fetch('/posts.json');
			if (!res.ok) throw new Error('posts.json missing');
			postsIndex = await res.json();
			populatePostsList(postsIndex);
		} catch (e) {
			// Fallback: build from existing links on homepage TOC if available
			const links = qsa('.table-of-contents .content-entry');
			postsIndex = links.map(a => ({ title: a.textContent.trim(), url: a.getAttribute('href'), slug: a.getAttribute('href').replace(/\/?$/,'') }));
			populatePostsList(postsIndex);
		}
	}

	function populatePostsList(items) {
		// hide selection UI in simplified flow
		if (postsSelectEl) postsSelectEl.hidden = true;
	}

	postSearchEl?.addEventListener('input', () => {
		// no-op in simplified flow
	});

	async function fetchHtml(url) {
		if (htmlCache.has(url)) return htmlCache.get(url);
		const res = await fetch(url);
		const html = await res.text();
		htmlCache.set(url, html);
		return html;
	}

	function extractArticle(html) {
		const d = document.implementation.createHTMLDocument('x');
		document.documentElement.dataset.tmp = '1';
		d.body.innerHTML = html;
		const article = d.querySelector('article.post__article .content-wrapper') || d.querySelector('article');
		return article ? article.innerHTML : html;
	}

	function coverBackSheet() {
		const poster = '/assets/images/pagaidu-book-cover.jpg';
		const sheet = document.createElement('div');
		sheet.className = 'page cover-back';
		sheet.innerHTML = `
			<div class="sheet two-up">
				<div class="panel back dark">
					<div class="backside">${document.querySelector('#backside-description-template')?.innerHTML || ''}</div>
				</div>
				<div class="panel cover">
					<img class="cover-image" src="${poster}" alt="Vāks">
				</div>
			</div>
		`;
		return sheet;
	}

	async function buildOutput(cfg) {
		root.innerHTML = '';
		applyRootClasses(cfg);
		if (cfg.includeCover) root.appendChild(coverBackSheet());
		if (cfg.includeForeword) {
			const html = await fetchHtml('/prieksvards/');
			const page = document.createElement('div');
			page.className = 'page content';
			page.innerHTML = extractArticle(html);
			root.appendChild(page);
		}
		if (cfg.includePosts) {
			let items = postsIndex.slice();
			// keep canonical order (from posts.json)
			for (const p of items) {
				const html = await fetchHtml(p.url);
				const page = document.createElement('div');
				page.className = 'page content';
				page.innerHTML = extractArticle(html);
				root.appendChild(page);
			}
		}
		estimateColorUsage();
	}

	function estimateColorUsage() {
		const pages = root.querySelectorAll('.page').length || 0;
		let colorSheets = 0;
		if (qs('select[name="colorMode"]').value === 'color') {
			colorSheets = Math.max(1, Math.ceil(pages * 0.3));
		}
		if (colorEstimateEl) colorEstimateEl.textContent = `Aptuvenais krāsaino lapu skaits: ${colorSheets}`;
	}

	buildBtn.addEventListener('click', async () => {
		const cfg = getConfig();
		await buildOutput(cfg);
		history.replaceState(null, '', '?' + toQuery(cfg));
		printBtn.disabled = false;
	});

	printBtn.addEventListener('click', async () => {
		window.print();
	});

	shareBtn.addEventListener('click', () => {
		const cfg = getConfig();
		const url = location.origin + location.pathname + '?' + toQuery(cfg);
		navigator.clipboard?.writeText(url);
		shareBtn.textContent = 'Saite nokopēta';
		setTimeout(() => (shareBtn.textContent = 'Kopīgot iestatījumus (URL)'), 1500);
	});

	loadPostsIndex().then(() => {
		fromQuery();
	});
})();


