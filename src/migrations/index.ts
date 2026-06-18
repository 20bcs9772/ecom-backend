import * as migration_20260530_185313 from './20260530_185313';
import * as migration_20260618_162511 from './20260618_162511';

export const migrations = [
  {
    up: migration_20260530_185313.up,
    down: migration_20260530_185313.down,
    name: '20260530_185313',
  },
  {
    up: migration_20260618_162511.up,
    down: migration_20260618_162511.down,
    name: '20260618_162511'
  },
];
