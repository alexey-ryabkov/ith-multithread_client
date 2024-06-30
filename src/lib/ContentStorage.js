import { blobToBase64, deepMerge } from './utils';

/**
 * @typedef {string} Key
 * @typedef {string} Group
 * @typedef {string} StoredItem
 * @typedef {Object.<Key,StoredItem>} StoredItems
 * @typedef {Object<Group,Key[]>} Meta
 */

export default class ContentStorage {
	static _META_KEY = '__meta__';
	/** @type {ContentStorage} */
	static _instance;
	/** @type {Key[]} */
	_keys = [];

	constructor() {
		if (ContentStorage._instance) {
			throw new Error('Use ContentStorage.instance for use ContentStorage singleton class object');
		}
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key !== ContentStorage._META_KEY) {
				this._keys.push(localStorage.key(i));
			}
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
	 * @returns {Key[]}
	 */
	get keys() {
		return this._keys;
	}
	/**
	 * @returns {Object.<Group,Key[]>}
	 */
	get keysByGroups() {
		return this._meta;
	}
	/**
	 * @returns {Object.<Group,StoredItems>}
	 */
	get itemsByGroups() {
		const content = this.getItems();
		return Object.entries(this._meta).reduce((allRes, [group, keys]) => {
			allRes[group] = keys.reduce((groupRes, key) => {
				groupRes[key] = content[key];
				return groupRes;
			}, {});
			return allRes;
		}, {});
	}
	/**
	 * @param {Key} key
	 * @returns {StoredItem|null}
	 */
	getItem(key) {
		return localStorage.getItem(key);
	}
	/**
	 * @param {Key[]} [filter]
	 * @returns {StoredItems}
	 */
	getItems(filter) {
		return this._keys
			.filter((key) => !filter || filter.includes(key))
			.reduce(async (allContent, key) => {
				allContent[key] = this.getItem(key);
				return allContent;
			}, {});
	}
	/**
	 * @param {Group} group
	 * @returns {StoredItems}
	 */
	getItemsInGroup(group) {
		return this.getItems(this._meta?.[group]);
	}
	/**
	 * @param {Group} group
	 * @returns {Object.<Group,Key[]>}
	 */
	getKeysInGroup(group) {
		return this._meta?.[group] ?? [];
	}
	/**
	 * @param {Key} key
	 * @param {Blob|string} content
	 * @param {Group} [group]
	 */
	async save(key, content, group = 'uncategorized') {
		if (typeof content !== 'string') {
			content = await blobToBase64(content);
		}
		localStorage.setItem(key, /** @type {string} */ (content));
		this._keys.push(key);
		this._addMeta({ [group]: [key] });
	}
	clear() {
		localStorage.clear();
	}
	/**
	 * @returns {Meta}
	 */
	get _meta() {
		return JSON.parse(localStorage.getItem(ContentStorage._META_KEY) ?? '{}');
	}
	/**
	 * @param {Meta} meta
	 */
	_addMeta(meta) {
		localStorage.setItem(ContentStorage._META_KEY, JSON.stringify(deepMerge(this._meta, meta)));
	}
}
