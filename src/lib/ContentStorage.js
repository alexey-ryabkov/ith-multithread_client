import { blobToBase64 } from './utils';

export default class ContentStorage {
	/** @type {ContentStorage} */
	static _instance;	
	_keys = [];

	constructor() {
		if (ContentStorage._instance) {
			throw new Error("Use ContentStorage.instance for use ContentStorage singleton class object");
		}
		this._storage = window.localStorage;
		for (let i = 0; i < this._storage.length; i++) {
			this._keys.push(this._storage.key(i));
		}
		ContentStorage._instance = this;
	}
	/**
	 * @returns {ContentStorage}
	 */
	static get instance() {
		if (!ContentStorage._instance) {
      ContentStorage._instance = new ContentStorage();
    }
		return ContentStorage._instance;		
	}
	/**
	 * @returns {string[]}
	 */
	get keys() {
		return this._keys;
	}
	/**
	 * @param {string} key
	 * @param {Blob|string} content
	 */
	async save(key, content) {
		if (typeof content !== 'string') {
      content = await blobToBase64(content);
		}
    this._storage.setItem(key, /** @type {string} */ (content));
		this._keys.push(key);
	}
	/**
	 * @param {string} key
	 * @returns {string|null}
	 */
	get(key) { 
    return this._storage.getItem(key);
  }
	/**
	 * @param {string} key
	 * @returns {Object.<string,string>}
	 */
	getAll() {
    return this._keys.reduce(async (allContent, key) => {
      allContent[key] = this.get(key);
      return allContent;
    }, {});
  }

	_clear() {
		this._storage.clear();
	}
}
