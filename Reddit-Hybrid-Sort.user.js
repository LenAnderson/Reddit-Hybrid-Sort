// ==UserScript==
// @name         Reddit - Hybrid Sort
// @namespace    https://github.com/LenAnderson/
// @downloadURL  https://github.com/LenAnderson/Reddit-Hybrid-Sort/raw/master/Reddit-Hybrid-Sort.user.js
// @version      1.0.0
// @author       LenAnderson
// @match        https://www.reddit.com/
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




	class RedditHybridSort {
	constructor() {
		this.sorts = [''];
		this.siteTable = $('#siteTable')

		this.loadMore = null;

		this.reloadTimeout = null;

		this.config = $$('#header-bottom-left > .tabmenu > li');

		const css = document.createElement('style'); {
			css.innerHTML = '.rhs--loadMore {  clear: left;  text-align: center;}.rhs--loadMore > .rhs--loadMore--button {  padding: 1px 4px;  background: rgb(238 238 238);  border: 1px solid rgb(221 221 221);  border-radius: 3px;  font-weight: bold;  font-size: 2em;}#siteTable > .thing.rhs--thing {  position: relative;}#siteTable > .thing.rhs--thing:before {  color: rgb(198 198 198);  display: block;  left: 0;  overflow: hidden;  position: absolute;  text-align: center;  text-overflow: ellipsis;  top: 0;  white-space: nowrap;  width: 36px;}#siteTable > .thing.rhs--thing.rhs--best:before {  content: \"best\";}#siteTable > .thing.rhs--thing.rhs--hot:before {  content: \"hot\";}#siteTable > .thing.rhs--thing.rhs--new:before {  content: \"new\";}#siteTable > .thing.rhs--thing.rhs--rising:before {  content: \"rising\";}#siteTable > .thing.rhs--thing.rhs--controversial:before {  content: \"controversial\";}#siteTable > .thing.rhs--thing.rhs--top:before {  content: \"top\";}#siteTable > .thing.rhs--thing.rhs--gilded:before {  content: \"gilded\";}';
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
	const app = new RedditHybridSort();
})();