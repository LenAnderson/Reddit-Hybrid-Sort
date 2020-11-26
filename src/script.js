// ==UserScript==
// @name         Reddit - Hybrid Sort
// @namespace    https://github.com/LenAnderson/
// @downloadURL  https://github.com/LenAnderson/Reddit-Hybrid-Sort/raw/master/Reddit-Hybrid-Sort.user.js
// @version      1.0.0
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




	${include: RedditHybridSort.js}
	const app = new RedditHybridSort();
})();