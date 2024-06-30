<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import {
		ListBox,
		ListBoxItem,
		ProgressRadial,
		Tab,
		TabGroup,
		TreeView,
		TreeViewItem
	} from '@skeletonlabs/skeleton';
	import { Toast, getToastStore, initializeStores } from '@skeletonlabs/skeleton';
	import Preloader from '$lib/components/Preloader.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ContentStorage from '$lib/ContentStorage';
	import { formatBytes } from '$lib/utils';
	import { handleError, inErrorBoundary } from '$lib/utils/errorsHandling';

	const WS_ADDRESS = 'localhost:8080';
	const WS_PING_DELAY = 20000;
	const WS_RECONNECT_DELAY = 1000;
	const WS_CONN_FAILURE_CODE = 1006;
	const ERR_TOAST_TIMEOUT = 10000;

	/**
	 * @typedef {import('svelte/store').Writable<string[]>} Writable
	 */
	/** @type Writable */
	const downloadedUrls = writable([]);
	/** @type Writable */
	const keywordUrls = writable([]);

	/** @type {WebSocket} */
	let ws;
	/** @type {ContentStorage} */
	let contentStorage;
	/** @type {(Uint8Array|string)[][]} */
	let contentChunks = [];

	let keyword = '';
	let keywordOfLoadedURLs = '';
	let selectedUrl = '';
	let status = '';
	let progress = 0;
	let totalSize = 0;
	let threads = 0;
	let progressPercent = 0;
	let isUrlsLoading = false;
	let isContentDownloading = false;
	let noConnetion = true;
	let displayContent = '';	
	let tabSet = 0;

	$: status = totalSize
		? `Downloaded: ${formatBytes(progress)} of ${formatBytes(totalSize)} with ${threads} threads`
		: isContentDownloading
			? 'Downloading starts'
			: '';
	$: progressPercent = totalSize ? Math.round((progress / totalSize) * 100) : 0;
	$: contents = $downloadedUrls.map((url) => contentStorage.getItem(url));

	initializeStores();
	const toastStore = getToastStore();

	onMount(() => {
		contentStorage = ContentStorage.instance;
		downloadedUrls.set(Array.from(contentStorage.keys));
		wsOpen();
	});

	function loadUrls() {
		ws.send(JSON.stringify({ keyword }));
		isUrlsLoading = true;
		selectedUrl = status = '';
		keywordOfLoadedURLs = '';
		progress = totalSize = threads = 0;
	}
	/**
	 * @param {string} url
	 */
	function downloadContent(url) {
		ws.send(JSON.stringify({ url }));
		isContentDownloading = true;
		status = '';
		progress = totalSize = threads = 0;
	}
	/**
	 * @param {unknown} error
	 * @param {boolean} autohide
	 */
	function showError(error, autohide = true) {
		const message = /** @type string */ (handleError(error, false));
		toastStore.trigger({
			background: 'variant-filled-error',
			hoverable: true,
			timeout: ERR_TOAST_TIMEOUT,
			message,
			autohide
		});
	}
	function clearContent() {
		contentStorage.clear();
		downloadedUrls.set([]);
	}
	function wsOpen() {
		if (
			!ws ||
			/** @type number[] */ ([WebSocket.CLOSED, WebSocket.CLOSING]).includes(ws.readyState)
		) {
			ws = new WebSocket(`ws://${WS_ADDRESS}`);
			ws.addEventListener('open', () => {
				noConnetion = false;
				console.info('ws successfully opened');
				wsPing();
			});
			ws.addEventListener('message', ({ data: rawData }) => {
				const data = inErrorBoundary(
					() => JSON.parse(rawData),
					() => ({}),
					(err) => {
						showError(err);
						console.error(err);
					}
				);
				const { urls, chunk, threadNum, error, pong } = data;

				if (error) {
					showError(error);
					isUrlsLoading = false;
					return;
				}
				if (pong) return;

				({ progress = 0, totalSize = 0, threads = 0 } = data);
				if (urls) {
					keywordUrls.set(urls);
					keywordOfLoadedURLs = keyword;
					isUrlsLoading = false;
				} else if (progress) {
					if (!contentChunks[threadNum]) {
						contentChunks[threadNum] = [];
					}
					contentChunks[threadNum].push(new Uint8Array(Object.values(chunk)));
					if (progress == totalSize) {
						contentStorage
							.save(
								selectedUrl,
								new Blob(contentChunks.flat(), { type: 'image/jpeg' }),
								keywordOfLoadedURLs
							)
							.catch((err) => {
								showError(err);
								console.error(err);
							})
							.then(() => {
								contentChunks = [];
								isContentDownloading = false;
								downloadedUrls.update((current) => [...current, selectedUrl]);
							});
					}
				} else {
					console.warn('Unknown message recieved');
				}
			});
			ws.addEventListener('close', (closeEvent) => {
				noConnetion = true;
				const { wasClean, code, reason } = closeEvent;
				if (!wasClean) {
					if (code === WS_CONN_FAILURE_CODE) {
						showError(
							'WebSocket connection failed. Make sure the server is running and reload page.',
							false
						);
					} else {
						console.warn(
							`ws disconnected, code: ${code ?? 0}, reason: ${reason || 'no provided'}`,
							closeEvent
						);
						setTimeout(wsOpen, WS_RECONNECT_DELAY);
					}
				} else {
					console.info('ws manually closed', closeEvent);
				}
			});
		}
	}
	function wsPing() {
		setTimeout(() => {
			if (
				!(/** @type number[] */ ([WebSocket.CLOSED, WebSocket.CLOSING]).includes(ws.readyState))
			) {
				ws.send(JSON.stringify({ ping: true }));
				wsPing();
			}
		}, WS_PING_DELAY);
	}
</script>

<main class="container mx-auto py-8 px-6 min-w-96">
	<h1 class="gradient-heading mb-4">
		Multithread<br />
		Download Client
	</h1>
	<TabGroup justify="justify-center">
		<Tab bind:group={tabSet} name="tab1" value={0}>Choose and Download</Tab>
		<Tab bind:group={tabSet} name="tab2" value={1}>View content</Tab>
		<svelte:fragment slot="panel">
			{#if tabSet === 0}
				<form class="input-group input-group-divider grid-cols-[1fr_auto] mx-auto mb-4 max-w-96">
					<input
						bind:value={keyword}
						disabled={isUrlsLoading || isContentDownloading || noConnetion}
						type="text"
						placeholder="Content URLs keyword"
					/>
					<button
						on:click={loadUrls}
						disabled={isUrlsLoading || isContentDownloading || noConnetion}
						class="btn variant-filled-primary"
					>
						{#if isUrlsLoading}
							<Preloader name="tubeSpinner" class="mr-1" />
						{/if}
						show
					</button>
				</form>
				{#if keywordOfLoadedURLs && !isUrlsLoading}
					<div
						class="{status
							? 'flex flex-wrap align-top gap-[5%]'
							: ''} w-full sm:space-y-0 space-y-4"
					>
						<div class={status ? 'sm:w-[70%] w-full' : 'w-full'}>
							{#if $keywordUrls.length}
								<p class="indent-4 mb-2">
									URLs list for <span class="font-bold">{keywordOfLoadedURLs}</span> keyword:
								</p>
								<div class="card p-4 text-token max-h-96 overflow-auto">
									<ListBox disabled={isContentDownloading || noConnetion}>
										{#each $keywordUrls as url}
											{@const isUrlDownloaded = $downloadedUrls.includes(url)}
											<ListBoxItem
												on:click={() => downloadContent(url)}
												bind:group={selectedUrl}
												name="urls"
												value={url}
												disabled={isUrlDownloaded}
											>
												<svelte:fragment slot="lead">
													{#if !isUrlDownloaded}
														<Icon name="download" size={20} />
													{:else}
														<Icon name="check" size={20} class="text-success-500" />
													{/if}
												</svelte:fragment>
												{url}
											</ListBoxItem>
										{/each}
									</ListBox>
								</div>
							{:else}
								<p class="text-center">
									No URLs for keyword <span class="font-bold">{keywordOfLoadedURLs}</span>.
								</p>
							{/if}
						</div>
						{#if status}
							<div class="sm:w-1/4 w-full">
								<p class="text-center mb-2">Downloading:</p>
								<div class="mb-2">
									<ProgressRadial value={progressPercent} font={100} width="sm:w-full w-80 mx-auto"
										>{progressPercent}%</ProgressRadial
									>
								</div>
								<p class="text-center">{status}</p>
							</div>
						{/if}
					</div>
				{/if}
			{:else if tabSet === 1}
				{#if contents.length}
					{#if displayContent}
						<img
							src={displayContent}
							class="object-contain rounded-lg sm:w-4/5 w-full mx-auto mb-4"
							alt=""
						/>
					{/if}
					<div class="sm:w-4/5 w-full mx-auto mb-4">
						<TreeView width="w-full" selection>
							{#each Object.entries(contentStorage.keysByGroups) as [group, urls]}
								<TreeViewItem>
									<span class="font-bold">{group}</span>
									<svelte:fragment slot="children">
										{#each urls as url}
											<TreeViewItem
												on:click={() => (displayContent = contentStorage.getItem(url) ?? '')}
												>{url}</TreeViewItem
											>
										{/each}
									</svelte:fragment>
								</TreeViewItem>
							{/each}
						</TreeView>
					</div>
					<button
						on:click={clearContent}
						type="button"
						class="btn variant-filled sm:btn-lg block mx-auto">Clear all</button
					>
				{:else}
					<p class="text-center">There is no content here yet</p>
				{/if}
			{/if}
		</svelte:fragment>
	</TabGroup>
	<Toast />
</main>

<style>
	:global(.listbox-item) {
		border-radius: var(--theme-rounded-container);
	}
	:global(.listbox-label-content) {
		@apply overflow-hidden break-words;
	}
	:global(.tree-item-content) {
		@apply overflow-hidden break-words;
	}
	:global(.tree-item-summary) {
		@apply justify-center;
	}
	.gradient-heading {
		@apply h1 font-sans text-center;
		@apply bg-clip-text text-transparent box-decoration-clone;
		@apply bg-gradient-to-br;
		@apply from-primary-500 via-violet-500 to-secondary-500;
	}
</style>
