<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { ListBox, ListBoxItem, ProgressRadial, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import { Toast, getToastStore, initializeStores } from '@skeletonlabs/skeleton';
	import Preloader from '$lib/components/Preloader.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ContentStorage from '$lib/ContentStorage';
	import { formatBytes } from '$lib/utils';
	import { handleError, inErrorBoundary } from '$lib/utils/errorsHandling';

	const WS_ADDRESS = 'localhost:8080';
	const WS_CONN_FAILURE_CODE = 1006;
	const ERR_TOAST_TIMEOUT = 10000;

	/**
	 * @typedef {import('svelte/store').Writable<string[]>} Writable
	 */
	/** @type Writable */
	const downloadedUrls = writable([]);
	/** @type Writable */
	const keywordUrls = writable([]);

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
	let tabSet = 0;
	let noConnetion = false;

	$: status = totalSize
		? `Downloaded: ${formatBytes(progress)} of ${formatBytes(totalSize)} with ${threads} threads`
		: isContentDownloading
			? 'Downloading starts'
			: '';
	$: progressPercent = totalSize ? Math.round((progress / totalSize) * 100) : 0;
	$: contents = $downloadedUrls.map((url) => contentStorage.get(url));

	initializeStores();
	const toastStore = getToastStore();

	/** @type {WebSocket} */
	let ws;
	/** @type {ContentStorage} */
	let contentStorage;
	/** @type {(Uint8Array|string)[][]} */
	let contentChunks = [];

	onMount(() => {
		contentStorage = ContentStorage.instance;
		downloadedUrls.set(Array.from(contentStorage.keys));

		ws = new WebSocket(`ws://${WS_ADDRESS}`);
		ws.addEventListener('open', () => console.info('ws successfully opened'));
		ws.addEventListener('message', ({ data: rawData }) => {
			const data = inErrorBoundary(
				() => JSON.parse(rawData),
				() => ({}),
				(err) => {
					showError(err);
					console.error(err);
				}
			);
			const { urls, chunk, threadNum, error } = data;
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
						.save(selectedUrl, new Blob(contentChunks.flat(), { type: 'image/jpeg' }))
						.then(() => {
							contentChunks = [];
							isContentDownloading = false;
							downloadedUrls.update((current) => [...current, selectedUrl]);
						});
				}
			} else if (error) {
				showError(error);
				isUrlsLoading = false;
			}
		});
		ws.addEventListener('close', (closeEvent) => {
			const { wasClean, code, reason } = closeEvent;
			if (!wasClean) {
				if (code === WS_CONN_FAILURE_CODE) {
					showError('WebSocket connection failed', false);
					noConnetion = true;
				} else {
					console.warn(
						`ws disconnected, code: ${code ?? 0}, reason: ${reason || 'no provided'}`,
						closeEvent
					);
				}
			} else {
				console.info('ws manually closed', closeEvent);
			}
		});
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
</script>

<main class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-5">
		<h1 class="gradient-heading">
			HTTP<br />
			multithread<br />
			client
		</h1>
		<TabGroup justify="justify-center">
			<Tab bind:group={tabSet} name="tab1" value={0}>Choose and Download</Tab>
			<Tab bind:group={tabSet} name="tab2" value={1}>View content</Tab>
			<svelte:fragment slot="panel">
				{#if tabSet === 0}
					<!-- <p>Enter keyword, for example <a href="#science">science</a></p> -->
					<form class="input-group input-group-divider grid-cols-[1fr_auto]">
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
						{#if $keywordUrls.length}
							<p>URLs list for <span class="font-bold">{keywordOfLoadedURLs}</span> keyword:</p>
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
						{:else}
							<p class="text-center">
								No URLs for keyword <span class="font-bold">{keywordOfLoadedURLs}</span>.
							</p>
						{/if}
					{/if}
					{#if isContentDownloading || status}
						<ProgressRadial value={progressPercent} font={100}>{progressPercent}%</ProgressRadial>
						<p>{status}</p>
					{/if}
				{:else if tabSet === 1}
					{#if contents.length}
						{#each contents as image}
							<div class="card">
								<img src={image} alt="" />
							</div>
						{/each}
					{:else}
						<p class="text-center">There is no content here yet</p>
					{/if}
				{/if}
			</svelte:fragment>
		</TabGroup>
		<Toast />
	</div>
</main>

<style>
	.gradient-heading {
		@apply h1 font-sans text-center;
		@apply bg-clip-text text-transparent box-decoration-clone;
		@apply bg-gradient-to-br;
		@apply from-primary-500 via-violet-500 to-secondary-500;
	}
</style>
