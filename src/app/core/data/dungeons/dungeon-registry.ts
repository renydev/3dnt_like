import { DungeonConfig } from './shared/dungeon-config.types';

import { AllihannaConfig } from './allihanna';
import { RagnarConfig }    from './ragnar';
import { GloriennConfig }  from './glorienn';
import { LenaConfig }      from './lena';
import { HyninnConfig }    from './hyninn';
import { MarahConfig }     from './marah';
import { TenebraConfig }   from './tenebra';
import { AzgherConfig }    from './azgher';
import { TauronConfig }    from './tauron';
import { TannaTohConfig }  from './tanna-toh';
import { LinWuConfig }     from './lin-wu';
import { WynnaConfig }     from './wynna';
import { OceanoConfig }    from './oceano';
import { ThyatisConfig }   from './thyatis';
import { SszzaasConfig }   from './sszzaas';
import { KeennConfig }     from './keenn';
import { MegalokConfig }   from './megalokk';
import { NimbConfig }      from './nimb';
import { KhalmyrConfig }   from './khalmyr';
import { ValariaFinalConfig } from './valkaria';

export const DUNGEON_REGISTRY: Record<number, DungeonConfig> = {
   1: AllihannaConfig,
   2: RagnarConfig,
   3: GloriennConfig,
   4: LenaConfig,
   5: HyninnConfig,
   6: MarahConfig,
   7: TenebraConfig,
   8: AzgherConfig,
   9: TauronConfig,
  10: TannaTohConfig,
  11: LinWuConfig,
  12: WynnaConfig,
  13: OceanoConfig,
  14: ThyatisConfig,
  15: SszzaasConfig,
  16: KeennConfig,
  17: MegalokConfig,
  18: NimbConfig,
  19: KhalmyrConfig,
  20: ValariaFinalConfig,
};
