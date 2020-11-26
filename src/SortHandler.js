class SortHandler {
	constructor(sort) {
		this.sort = sort;
		this.things = [];
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
		const things = Array.from(html.querySelectorAll('#siteTable > .thing')).filter(thing=>!thing.classList.contains('promotedlink'));
		this.prepareThings(things);
		this.things.push(...things);
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