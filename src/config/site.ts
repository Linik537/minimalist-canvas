export const site = {
  name: 'Braza Veículos',
  slogan: 'Há mais de 30 anos realizando sonhos!',
  city: 'Uberlândia - MG',
  address: 'Av. João Pinheiro, 3123 - Brasil, Uberlândia - MG',
  postalCode: '38400-714',
  phones: { alexandreFilho: '(34) 3212-0868', alexandreBraza: '(34) 99971-3860' },
  whatsappNumber: '5534999713860',
  whatsappLink: 'https://wa.me/message/M2H4H7YFQEM5B1',
  contactWhatsapp: { alexandreBraza: 'https://wa.me/5534999713860', alexandreFilho: 'https://wa.me/553432120868' },
  socials: { instagram: '', facebook: '', youtube: '' },
  mapEmbed: 'https://www.google.com/maps?q=Av.+Jo%C3%A3o+Pinheiro,+3123,+Uberl%C3%A2ndia,+MG&output=embed',
  mapDirections: 'https://www.google.com/maps/search/?api=1&query=Av.+Jo%C3%A3o+Pinheiro,+3123,+Uberl%C3%A2ndia,+MG',
  timezone: 'America/Sao_Paulo',
  opening: { days: [1, 2, 3, 4, 5, 6], opens: '08:30', closes: '18:00' },
  monthlyInterestRate: 0.0199
} as const
export const openingHoursLabel = `Segunda a sábado, ${site.opening.opens} às ${site.opening.closes}`
