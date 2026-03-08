// Bootstrap loaded via --import in worker threads so tsx can transpile .ts imports.
import { register } from 'tsx/esm/api'
register()
