export const pause = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getRandomNumber = (min: number, max: number) => {
  const floor = Math.ceil(min);
  return Math.floor(Math.random() * (Math.floor(max) - floor)) + floor;
};
