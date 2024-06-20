<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let keyword = '';

	/*
	 * @type {Writable<string[]>}
	 */
	let urls = writable([]);
	let selectedUrl = '';
	let status = '';
	let downloadedContent = '';

	/**
	 * @type {WebSocket}
	 */
	let ws;
	onMount(() => {
		ws = new WebSocket('ws://localhost:8080');

		ws.onmessage = (event) => {
			// TODO тут нужен try-catch 
			const data = JSON.parse(event.data);
			if (data.urls) {
				urls.set(data.urls);
			} else if (data.progress !== undefined) {
				status = `Downloaded: ${data.progress} / ${data.totalSize} bytes with ${data.threads} threads`;
			} else if (data.error) {
				console.error(data.error);
				// TODO пользователю не показываем детали ошибки, а выводим в консоль 
			}
		};
	});

	function search() {
		ws.send(JSON.stringify({ keyword }));
	}

	/**
	 * @param {string} url
	 */
	function download(url) {
		ws.send(JSON.stringify({ url }));
	}
</script>
<main class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-5">
		<h1 class="h1">Multithreaded http-client!</h1>
		<input
			type="text"
			bind:value={keyword}
			placeholder="Enter keyword"
			class="input input-bordered"
		/>
		<button on:click={search} class="btn btn-primary ml-2">Search</button>
		<ul class="list-disc ml-6 mt-4">
			{#each $urls as url}
				<li on:click={() => download(url)} class="cursor-pointer hover:underline">{url}</li>
			{/each}
		</ul>
		<div class="mt-4">{status}</div>
		<div class="mt-4">{downloadedContent}</div>
	</div>
</main>
