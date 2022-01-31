// ==UserScript==
// @name         Reddit - Hybrid Sort
// @namespace    https://github.com/LenAnderson/
// @downloadURL  https://github.com/LenAnderson/Reddit-Hybrid-Sort/raw/master/Reddit-Hybrid-Sort.user.js
// @version      1.2.0
// @author       LenAnderson
// @match        https://www.reddit.com/
// @match        https://www.reddit.com/?*
// @grant        none
// ==/UserScript==

(()=>{
	'use strict';

	const log = (...msgs)=>console.log.call(console.log, '[Reddit-HybridSort]', ...msgs);
	
	
	const $ = (query)=>document.querySelector(query);
	const $$ = (query)=>Array.from(document.querySelectorAll(query));


	const get = (url) => {
		return new Promise((resolve,reject)=>{
			const xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.addEventListener('load', ()=>{
				resolve(xhr.responseText);
			});
			xhr.addEventListener('error', ()=>{
				reject(xhr);
			});
			xhr.send();
		});
	};
	const getHtml = (url) => {
		return get(url).then(txt=>{
			const html = document.createElement('div');
			html.innerHTML = txt;
			return html;
		});
	};


	const wait = async(millis)=>new Promise(resolve=>setTimeout(resolve, millis));




	class SortHandler {
	constructor(sort) {
		this.sort = sort;
		this.things = [];
		this.ids = [];
		this.reachedEnd = false;
	}


	get sortTitle() {
		if (this.sort == '') return 'best';
		return this.sort;
	}
	get after() {
		if (this.things.length > 0) {
			return this.things.slice(-1)[0].getAttribute('data-fullname');
		}
		return null;
	}




	async loadMore() {
		if (this.reachedEnd) {
			log('no more things for  ', this.sortTitle);
			return [];
		}

		const html = await getHtml(`https://www.reddit.com/${this.sort}/?count=${this.things.length}&after=${this.after}`);
		const things = Array.from(html.querySelectorAll('#siteTable > .thing')).filter(thing=>!thing.classList.contains('promotedlink')).filter(it=>this.ids.indexOf(it.id)==-1);
		this.prepareThings(things);
		this.things.push(...things);
		this.ids = things.map(it=>it.id);
		if (things.length == 0) {
			this.reachedEnd = true;
		}
		return things;
	}


	prepareThings(things) {
		things.forEach(thing=>{
			thing.classList.add('rhs--thing');
			thing.classList.add(`rhs--${this.sortTitle}`);
		});
	}
}
class RedditHybridSort {
	constructor() {
		this.sorts = [''];
		this.siteTable = $('#siteTable');

		this.loadMore = null;

		this.reloadTimeout = null;

		this.config = $$('#header-bottom-left > .tabmenu > li');

		const css = document.createElement('style'); {
			css.innerHTML = '.rhs--loadMore {  clear: left;  text-align: left;  padding-left: 20px;}.rhs--loadMore > .rhs--loadMore--button {  background: rgb(238 238 238);  border: 1px solid rgb(221 221 221);  border-radius: 3px;  display: inline-block;  font-weight: bold;  font-size: 2em;  padding: 1px 4px;  text-align: center;  width: 150px;}.rhs--loadMore > .rhs--loadMore--button > .rhs--spinner {  display: none;}.rhs--loadMore > .rhs--loadMore--button > .rhs--spinner:before {  content: \".\";  display: inline-block;}.rhs--loadMore.rhs--loading > .rhs--loadMore--button > .rhs--label {  display: none;}.rhs--loadMore.rhs--loading > .rhs--loadMore--button > .rhs--spinner {  cursor: progress;  display: inline;}.rhs--loadMore.rhs--loading > .rhs--loadMore--button > .rhs--spinner:before {  animation-name: rhs--spinner;  animation-duration: 2s;  animation-iteration-count: infinite;}@keyframes rhs--spinner {  0% {    content: \'.\';  }  25% {    content: \'..\';  }  75% {    content: \'...\';  }}#siteTable > .thing.rhs--thing {  position: relative;}#siteTable > .thing.rhs--thing:before {  color: rgb(198 198 198);  display: block;  left: 0;  overflow: hidden;  position: absolute;  text-align: center;  text-overflow: ellipsis;  top: 0;  white-space: nowrap;  width: 36px;}#siteTable > .thing.rhs--thing.rhs--best:before {  content: \"best\";}#siteTable > .thing.rhs--thing.rhs--hot:before {  content: \"hot\";}#siteTable > .thing.rhs--thing.rhs--new:before {  content: \"new\";}#siteTable > .thing.rhs--thing.rhs--rising:before {  content: \"rising\";}#siteTable > .thing.rhs--thing.rhs--controversial:before {  content: \"controversial\";}#siteTable > .thing.rhs--thing.rhs--top:before {  content: \"top\";}#siteTable > .thing.rhs--thing.rhs--gilded:before {  content: \"gilded\";}body.rhs--after-100 > .content .link .rank,body.rhs--after-100 > .rank-spacer {  width: 3.3ex;}body.rhs--after-1000 > .content .link .rank,body.rhs--after-1000 > .rank-spacer {  width: 4.4ex;}body.rhs--after-10000 > .content .link .rank,body.rhs--after-10000 > .rank-spacer {  width: 5.5ex;}';
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
					this.siteTable.insertBefore(thing, this.loadMore);
					if (!first) {
						first = thing;
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
	const app = new RedditHybridSort();
})();