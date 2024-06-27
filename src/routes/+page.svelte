<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { ListBox, ListBoxItem, ProgressRadial, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import Preloader from '$lib/components/Preloader.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ContentStorage from '$lib/ContentStorage';
	import { formatBytes } from '$lib/utils';

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

	$: status = totalSize
		? `Downloaded: ${formatBytes(progress)} of ${formatBytes(totalSize)} with ${threads} threads`
		: isContentDownloading
			? 'Downloading starts'
			: '';
	$: progressPercent = totalSize ? Math.round((progress / totalSize) * 100) : 0;

	/** @type {WebSocket} */
	let ws;
	/** @type {ContentStorage} */
	let contentStorage;
	/** @type {(Uint8Array|string)[]} */
	let contentChunks = [];

	onMount(() => {
		contentStorage = ContentStorage.instance;
		downloadedUrls.set(contentStorage.keys);

		ws = new WebSocket('ws://localhost:8080');
		ws.onmessage = ({ data: rawData }) => {
			// TODO тут нужен try-catch
			const data = JSON.parse(rawData);
			const { chunk, urls, error = null } = data;
			({ progress = 0, totalSize = 0, threads = 0 } = data);
			if (urls) {
				keywordUrls.set(urls);
				keywordOfLoadedURLs = keyword;
				isUrlsLoading = false;
			} else if (progress) {
				contentChunks.push(new Uint8Array(Object.values(chunk)));
				if (progress == totalSize) {
					contentStorage
						.save(selectedUrl, new Blob(contentChunks, { type: 'image/jpeg' }))
						.then(() => {
							contentChunks = [];
							isContentDownloading = false;
							downloadedUrls.update((current) => [...current, selectedUrl]);
						});
				}
			} else if (error) {
				console.error(error);
				// TODO toast c ошибкой для пользователя
			}
		};
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
							disabled={isUrlsLoading || isContentDownloading}
							type="text"
							placeholder="Content URLs keyword"
						/>
						<button
							on:click={loadUrls}
							disabled={isUrlsLoading || isContentDownloading}
							class="btn variant-filled-primary"
						>
							{#if isUrlsLoading}
								<Preloader name="tubeSpinner" class="mr-1" />
							{/if}
							show
						</button>
					</form>
					{#if $keywordUrls.length && !isUrlsLoading}
						<p>URLs list for <span class="font-bold">{keywordOfLoadedURLs}</span> keyword:</p>
						<ListBox disabled={isContentDownloading}>
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
					{/if}
					{#if isContentDownloading || status}
						<ProgressRadial value={progressPercent} font={100}>{progressPercent}%</ProgressRadial>
						<p>{status}</p>
					{/if}
				{:else if tabSet === 1}
					{#if $downloadedUrls.length}
						{#each $downloadedUrls as url}
							{@const image = contentStorage.get(url)}
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
