// Mapping of validator names (lowercase) to their logo filenames
export const validatorLogos: Record<string, string> = {
  'vnbnode': 'VNBnode.jpg',
  'ainodes': 'ainodes.svg',
  'aknodes': 'aknodes.png',
  'all nodes': 'all nodes.jpeg',
  'andromedapool': 'andromedapool.jpg',
  'atlas-staking': 'atlas staking.png',
  'avail space': 'avail space.jpeg',
  'blacknodes': 'blacknodes.png',
  'blockhunters': 'blockhunters.jpeg',
  'blockshard': 'blockshard.png',
  'bountyblok': 'bountyblok.jpg',
  'brightlystake': 'brightlystake.jpg',
  'coinage': 'coinage.svg',
  'coinhunters': 'coinhunters.jpeg',
  'coinpri': 'coinpri.jpg',
  'coinstudio': 'coinstudio.jpg',
  'cryptocrew': 'cryptocrew.png',
  'cumulo': 'cumlo.jpg',
  'despread': 'despread.jpg',
  'encapsulate': 'encapsulate.jpg',
  'enigma': 'enigma.jpg',
  'girnar nodes': 'girnaar.jpg',
  'global stake': 'globalstake.png',
  'hashkey': 'hashkey.svg',
  'infrasingularity': 'infrasingularity.png',
  'kj nodes': 'kjnodes.jpg',
  'klever': 'klever.png',
  'kyve foundation': 'kyvefoundation.jpg',
  'lavender.five nodes': 'lavendar-five.png',
  'lithium digital': 'lithium digital.jpg',
  'luganodes': 'luganodes.jpg',
  'mach5': 'mach5.png',
  'nd | nodes': 'nd nodes.jpg',
  'newroad': 'newroad.png',
  'node101': 'node101.svg',
  '[noders]': 'noders.png',
  'nodes guru': 'nodesguru.svg',
  'onfinality': 'onfinality.svg',
  'p-ops team': 'p-ops.jpeg',
  'pathrock network': 'pathrocknetwork.png',
  'quantnode': 'quantnode.jpg',
  'ryabina': 'ryabina.jpg',
  'senseinode': 'sensei.png',
  'silk nodes': 'silk nodes.jpeg',
  'speedy staking': 'speedy staking.jpg',
  'stake.works': 'stake.works.png',
  'stakely': 'stakely.png',
  'stakerhouse': 'stakerhouse.svg',
  'stakeway': 'stakeway.jpeg',
  'staking4all': 'staking4all.jpg',
  'subwallet': 'subwallet.png',
  'tecnodes': 'tecnodes.jpg',
  'vido.info': 'vido.info.svg',
  'vitwit': 'vitwit.jpeg',
  'xangle': 'xangle.jpg',
  'zan': 'zan.svg',
};

// Get logo URL for a validator name
export function getValidatorLogo(name: string | undefined): string | null {
  if (!name) return null;
  
  const normalizedName = name.toLowerCase().trim();
  const logoFile = validatorLogos[normalizedName];
  
  if (logoFile) {
    return `/logos/${encodeURIComponent(logoFile)}`;
  }
  
  return null;
}
