class RedditHybridSort {
	constructor() {
		this.sorts = [''];
		this.siteTable = $('#siteTable')

		this.loadMore = null;

		this.reloadTimeout = null;

		this.config = $$('#header-bottom-left > .tabmenu > li');

		const css = document.createElement('style'); {
			css.innerHTML = '${include-min-esc: css/style.css}';
			document.body.appendChild(css);
		}

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




	init() {
		this.siteTable.innerHTML = '';

		this.count = [];
		this.after = [];
		this.things = [];
		this.sorts.forEach(it=>{
			this.count.push(null);
			this.after.push(null);
			this.things.push([]);
		});

		const loadMore = document.createElement('div'); {
			this.loadMore = loadMore;
			loadMore.classList.add('rhs--loadMore');
			const btn = document.createElement('a'); {
				btn.classList.add('rhs--loadMore--button');
				btn.textContent = 'Load More';
				btn.href = 'javascript:;';
				btn.addEventListener('click', ()=>this.loadPosts());
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
		this.init();
	}




	async loadPosts() {
		const pages = await Promise.all(this.sorts.map((sort,idx) => getHtml(`https://www.reddit.com/${sort}/?count=${this.count[idx]}&after=${this.after[idx]}`)));
		const postLists = pages.map(page=>Array.from(page.querySelectorAll('#siteTable > .thing')).filter(thing=>!thing.classList.contains('promotedlink')));
		for (let index = 0; index < postLists.reduce((prev, curr)=>Math.max(prev,curr.length),0); index++) {
			postLists.forEach((list,idx)=>{
				if (list.length > index) {
					const thing = list[index];
					thing.classList.add('rhs--thing');
					thing.classList.add(`rhs--${this.sorts[idx]||'best'}`);
					this.siteTable.insertBefore(thing, this.loadMore);
					this.things[idx].push(thing);
				}
			});
		}
		this.count = this.things.map(list=>list.length);
		this.after = postLists.map(list=>list.slice(-1)[0].getAttribute('data-fullname'));
		const first = postLists.filter(it=>it.length);
		if (first.length > 0) {
			first[0][0].scrollIntoViewIfNeeded();
		}
	}
}