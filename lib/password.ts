export function generateSecurePassword(length = 14): string {
  if (!Number.isInteger(length) || length < 12 || length > 128)
    throw new Error("invalid_password_length");
  const lowercase = "abcdefghjkmnpqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "!@#$%^&*()_+~|}{[]:;?><=";
  const all = lowercase + uppercase + numbers + symbols;

  const randomIndex = (maximum: number) => {
    const buffer = new Uint32Array(1);
    const ceiling = 2 ** 32 - (2 ** 32 % maximum);
    do {
      crypto.getRandomValues(buffer);
    } while (buffer[0] >= ceiling);
    return buffer[0] % maximum;
  };
  let password = "";
  password += lowercase[randomIndex(lowercase.length)];
  password += uppercase[randomIndex(uppercase.length)];
  password += numbers[randomIndex(numbers.length)];
  password += symbols[randomIndex(symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += all[randomIndex(all.length)];
  }

  // Shuffle characters
  const characters = password.split("");
  for (let index = characters.length - 1; index > 0; index--) {
    const other = randomIndex(index + 1);
    [characters[index], characters[other]] = [
      characters[other],
      characters[index],
    ];
  }
  return characters.join("");
}
