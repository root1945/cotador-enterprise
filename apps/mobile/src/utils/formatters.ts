export const getPixType = (value: string) => {
  const clean = value.replace(/\D/g, "");

  if (value.includes("@")) return "E-mail";
  if (clean.length > 11) return "CNPJ";

  if (clean.length === 11) {
    const ddd = parseInt(clean.substring(0, 2));
    const isMobile = ddd >= 11 && clean[2] === "9";

    return isMobile ? "Celular" : "CPF";
  }

  if (clean.length > 20) return "Chave Aleatória";
  return "Chave Pix";
};

export const formatPixKey = (value: string) => {
  if (value.includes("@")) return value;

  const clean = value.replace(/\D/g, "");

  if (clean.length > 11) {
    return clean
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  }

  const ddd = parseInt(clean.substring(0, 2));
  const isMobileLike = clean.length > 2 && ddd >= 11 && clean[2] === "9";

  if (isMobileLike) {
    return clean
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  } else {
    return clean
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  }
};
