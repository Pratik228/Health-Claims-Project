export const formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getTrustScoreColor = (score) => {
  if (score >= 90) return "emerald-500";
  if (score >= 80) return "yellow-500";
  if (score >= 70) return "orange-500";
  return "red-500";
};

export const getVerificationBadge = (status) => {
  const badges = {
    verified: {
      color: "emerald",
      icon: "CheckCircle",
      text: "Verified",
    },
    questionable: {
      color: "yellow",
      icon: "AlertCircle",
      text: "Questionable",
    },
    debunked: {
      color: "red",
      icon: "XCircle",
      text: "Debunked",
    },
  };
  return badges[status] || badges.questionable;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return "just now";
};

export const validateApiKey = (key, type) => {
  const patterns = {
    openai: /^sk-[A-Za-z0-9]{32,}$/,
    perplexity: /^pplx-[A-Za-z0-9]{32,}$/,
  };

  return patterns[type]?.test(key) || false;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
