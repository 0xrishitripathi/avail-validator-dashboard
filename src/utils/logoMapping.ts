// Mapping of validator names (lowercase) to their logo filenames
export const validatorLogos: Record<string, string> = {
  '5elementsnodes': '5elements.jpg',
  'vnbnode': 'VNBnode.jpg',
  'ainodes': 'ainodes.jpg',
  'aknodes': 'aknodes.png',
  'all nodes': 'all nodes.jpeg',
  'andromedapool': 'andromedapool.jpg',
  'atlas-staking': 'atlas staking.png',
  'avail space': 'avail space.jpeg',
  'blacknodes': 'blacknodes.png',
  'blockhunters': 'blockhunters.jpeg',
  'blockpi network': 'blockpi.jpg',
  'blockshard': 'blockshard.png',
  'bountyblok': 'bountyblok.jpg',
  'brightlystake': 'brightlystake.jpg',
  'chainbase': 'chainbase.jpg',
  'coinagexdaic': 'coinage.svg',
  'coinhunters': 'coinhunters.jpeg',
  'coinpri': 'coinpri.jpg',
  'coinstudio': 'coinstudio.jpg',
  'cryptocrew': 'cryptocrew.png',
  'cryptostake': 'cryptostake.avif',
  'cumulo': 'cumlo.jpg',
  'despread': 'despread.jpg',
  'dsrv': 'dsrv.jpg',
  'encapsulate': 'encapsulate.jpg',
  'enigma': 'enigma.jpg',
  'girnar nodes': 'girnaar.jpg',
  'globalstake': 'globalstake.png',
  'hashkey': 'hashkey.jpg',
  'infrasingularity': 'infrasingularity.png',
  'kj nodes': 'kjnodes.jpg',
  'klever': 'klever.png',
  'kyve foundation': 'kyvefoundation.jpg',
  'lavender.five nodes': 'lavendar-five.png',
  'lesnik': 'lesnik.jpg',
  'lithium digital': 'lithium digital.jpg',
  'luganodes': 'luganodes.jpg',
  'mach5': 'mach5.png',
  'nd | nodes': 'nd nodes.jpg',
  'newroad': 'newroad.png',
  'node101': 'node101.jpg',
  '[noders]': 'noders.png',
  'nodes guru': 'nodesguru.svg',
  'onfinality': 'onfinality.jpg',
  'openbitlab': 'openbitlab.png',
  'openbuild': 'openbuild.jpg',
  'p-ops team': 'p-ops.jpeg',
  'p2p': 'p2p.png',
  'pathrock network': 'pathrocknetwork.jpg',
  'quantnode': 'quantnode.jpg',
  'ruby nodes': 'rubynodes.jpg',
  'ryabina': 'ryabina.jpg',
  'senseinode': 'sensei.png',
  'silk nodes': 'silk nodes.jpeg',
  'speedy staking': 'speedy staking.jpg',
  'stake.works': 'stake.works.png',
  'stakely': 'stakely.png',
  'stakepool': 'stakepool.jpg',
  'stakerhouse': 'stakerhouse.svg',
  'stakeway': 'stakeway.jpeg',
  'stakin': 'stakin.png',
  'staking4all': 'staking4all.jpg',
  'subwallet': 'subwallet.png',
  'tecnodes': 'tecnodes.jpg',
  'natsai': 'natsai.jpg',
  'vido.info': 'vido-info.png',
  'vitwit': 'vitwit.jpeg',
  'xangle': 'xangle.jpg',
  'zan': 'zan.jpg',
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
