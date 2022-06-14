import { SortHandler } from "./SortHandler.js";

export class RedditHybridSort {
	constructor() {
		this.thingIds = [];
		this.sorts = [''];
		this.siteTable = $('#siteTable');

		this.loadMore = null;

		this.reloadTimeout = null;

		this.config = $$('#header-bottom-left > .tabmenu > li');

		const css = document.createElement('style'); {
			css.innerHTML = '${include-min-esc: css/style.css}';
			document.body.appendChild(css);
		}

		this.afterClass = null;

		this.handlers = [];

		this.loadConfig();
		
		this.addConfig();

		this.init();
	}




	loadConfig() {
		this.sorts = JSON.parse(localStorage.getItem('rhs--sorts') || '[""]');
		const configIdx = this.config.map(it=>it.children[0].href.replace(/^https:\/\/www\.reddit\.com\/?(?:\/([^\/]+).*)?$/, '$1'));
		this.config.forEach(it=>it.classList.remove('selected'));
		this.sorts.forEach(sort=>this.config[configIdx.indexOf(sort)].classList.add('selected'));
	}
	saveConfig() {
		localStorage.setItem('rhs--sorts', JSON.stringify(this.sorts));
	}




	parseParams() {
		if (location.search.length > 1) {
			const url = location.search.substring(1).split('&').map(it=>it.split('=')).map(it=>[it[0],it[1].split(',')])
			const params = {
				sorts: url.find(it=>it[0] == 'rhsSort')[1],
				afters: url.find(it=>it[0] == 'rhsAfter')[1],
				counts: url.find(it=>it[0] == 'rhsCount')[1]
			};
			log(params);
			if (params.sorts && params.afters && params.counts) {
				return params;
			}
		}
		return null;
	}




	init() {
		this.siteTable.innerHTML = '';
		
		const params = this.parseParams();
		if (params) {
			this.sorts = params.sorts;
		}
		
		this.handlers = this.sorts.map(sort=>new SortHandler(sort));

		if (params) {
			this.handlers.forEach((handler, idx)=>{
				for (let i = 0; i < params.counts[idx]; i++) {
					if (i+1 == params.counts[idx]) {
						const el = document.createElement('div');
						el.setAttribute('data-fullname', params.afters[idx]);
						handler.things.push(el);
					} else {
						handler.things.push(null);
					}
				}
			});
		}

		const loadMore = document.createElement('div'); {
			this.loadMore = loadMore;
			loadMore.classList.add('rhs--loadMore');
			const btn = document.createElement('a'); {
				btn.classList.add('rhs--loadMore--button');
				btn.href = 'javascript:;';
				btn.addEventListener('click', ()=>this.loadPosts());
				const lbl = document.createElement('span'); {
					lbl.classList.add('rhs--label');
					lbl.textContent = 'Load More';
					btn.appendChild(lbl);
				}
				const spinner = document.createElement('span'); {
					spinner.classList.add('rhs--spinner');
					btn.appendChild(spinner);
				}
				loadMore.appendChild(btn);
			}
			this.siteTable.appendChild(loadMore);
		}

		this.loadPosts();
	}




	addConfig() {
		const header = $('#header-bottom-left');

		this.config.forEach(li=>{
			li.addEventListener('click', (evt) => {
				evt.preventDefault();
				evt.stopPropagation();
				li.classList.toggle('selected');
				this.triggerReload();
			});
		});
	}




	triggerReload() {
		if (this.reloadTimeout) {
			clearTimeout(this.reloadTimeout);
		}
		this.reloadTimeout = setTimeout(()=>this.reload(), 1000);
	}
	reload() {
		this.sorts = this.config.filter(it=>it.classList.contains('selected')).map(it=>it.children[0].href.replace(/^https:\/\/www\.reddit\.com\/?(?:\/([^\/]+).*)?$/, '$1'));
		this.saveConfig();
		history.replaceState(null, '', location.href.substring(0, location.href.length - location.search.length));
		this.init();
	}




	async loadPosts() {
		this.loadMore.classList.add('rhs--loading');
		if (this.handlers.filter(it=>it.after).length) {
			history.replaceState(null, '', `https://www.reddit.com/?rhsSort=${this.sorts.join(',')}&rhsAfter=${this.handlers.map(it=>it.after).join(',')}&rhsCount=${this.handlers.map(it=>it.things.length).join(',')}`);
		}
		const thingsList = await Promise.all(this.handlers.map(handler=>handler.loadMore()));

		let first = null;

		for (let thingIdx = 0; thingIdx < thingsList.reduce((prev, curr)=>Math.max(prev,curr.length),0); thingIdx++) {
			thingsList.forEach((list,sortIdx)=>{
				if (list.length > thingIdx) {
					const thing = list[thingIdx];
					if (this.thingIds.indexOf(thing.id) == -1) {
						this.thingIds.push(thing.id);
						this.siteTable.insertBefore(thing, this.loadMore);
						if (!first) {
							first = thing;
						}
					}
				}
			});
		}
		if (first) {
			first.scrollIntoViewIfNeeded();
		}

		const maxCount = this.handlers.reduce((max, handler)=>Math.max(max, handler.things.length), 0);
		if (this.afterClass) {
			document.body.classList.remove(this.afterClass);
		}
		this.afterClass = `rhs--after-${Math.pow(10, Math.floor(maxCount/10).toString().length)}`;
		document.body.classList.add(this.afterClass);

		this.loadMore.classList.remove('rhs--loading');
	}
}