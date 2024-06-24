<script>
	// @ts-nocheck
	export let name;
	export let size = 24;
	export let color = 'currentColor';

  const { class: className } = $$restProps;

	const preloaders = {
    tubeSpinner: `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" width="${size}" height="${size}" stroke="${color}" viewBox="0 0 200 200"
			><radialGradient
				id="a4"
				cx=".66"
				fx=".66"
				cy=".3125"
				fy=".3125"
				gradientTransform="scale(1.5)"
				><stop offset="0" stop-color="${color}"></stop><stop
					offset=".3"
					stop-color="${color}"
					stop-opacity=".9"
				></stop><stop offset=".6" stop-color="${color}" stop-opacity=".6"></stop><stop
					offset=".8"
					stop-color="${color}"
					stop-opacity=".3"
				></stop><stop offset="1" stop-color="${color}" stop-opacity="0"></stop></radialGradient
			><circle
				transform-origin="center"
				fill="none"
				stroke="url(#a4)"
				stroke-width="15"
				stroke-linecap="round"
				stroke-dasharray="200 1000"
				stroke-dashoffset="0"
				cx="100"
				cy="100"
				r="70"
				><animateTransform
					type="rotate"
					attributeName="transform"
					calcMode="spline"
					dur="2"
					values="360;0"
					keyTimes="0;1"
					keySplines="0 0 1 1"
					repeatCount="indefinite"
				></animateTransform></circle
			><circle
				transform-origin="center"
				fill="none"
				opacity=".2"
				stroke="${color}"
				stroke-width="15"
				stroke-linecap="round"
				cx="100"
				cy="100"
				r="70"
			></circle></svg
		>`,
		motionBlurBall: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="${color}" stroke="${color}" viewBox="0 0 200 200"
      ><circle stroke-width="15" r="15" cx="35" cy="100"
        ><animate
          attributeName="cx"
          calcMode="spline"
          dur="2"
          values="35;165;165;35;35"
          keySplines="0 .1 .5 1;0 .1 .5 1;0 .1 .5 1;0 .1 .5 1"
          repeatCount="indefinite"
          begin="0"
        ></animate></circle
      ><circle stroke-width="15" opacity=".8" r="15" cx="35" cy="100"
        ><animate
          attributeName="cx"
          calcMode="spline"
          dur="2"
          values="35;165;165;35;35"
          keySplines="0 .1 .5 1;0 .1 .5 1;0 .1 .5 1;0 .1 .5 1"
          repeatCount="indefinite"
          begin="0.05"
        ></animate></circle
      ><circle stroke-width="15" opacity=".6" r="15" cx="35" cy="100"
        ><animate
          attributeName="cx"
          calcMode="spline"
          dur="2"
          values="35;165;165;35;35"
          keySplines="0 .1 .5 1;0 .1 .5 1;0 .1 .5 1;0 .1 .5 1"
          repeatCount="indefinite"
          begin=".1"
        ></animate></circle
      ><circle stroke-width="15" opacity=".4" r="15" cx="35" cy="100"
        ><animate
          attributeName="cx"
          calcMode="spline"
          dur="2"
          values="35;165;165;35;35"
          keySplines="0 .1 .5 1;0 .1 .5 1;0 .1 .5 1;0 .1 .5 1"
          repeatCount="indefinite"
          begin=".15"
        ></animate></circle
      ><circle stroke-width="15" opacity=".2" r="15" cx="35" cy="100"
        ><animate
          attributeName="cx"
          calcMode="spline"
          dur="2"
          values="35;165;165;35;35"
          keySplines="0 .1 .5 1;0 .1 .5 1;0 .1 .5 1;0 .1 .5 1"
          repeatCount="indefinite"
          begin=".2"
        ></animate></circle
      ></svg
    >`
	};
</script>

{#if preloaders[name]}
	{@html preloaders[name]}
{/if}
