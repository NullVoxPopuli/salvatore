await new Promise((resolve) => {
  setTimeout(() => {
    console.log('This prints after 10 seconds');
    resolve(undefined);
  }, 10_000);
});
