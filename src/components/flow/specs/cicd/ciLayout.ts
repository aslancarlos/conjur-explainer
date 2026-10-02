import type { FlowLayout, Kind } from '../../FlowPlayer'

/**
 * Shared geometry for the CI/CD pipeline diagrams. Every pipeline flow has the
 * same four actors: the token issuer (idp), the pipeline job that runs the
 * CyberArk plugin (run), Secrets Manager (sm) and the deploy target (tgt).
 * Boxes fit 4 state rows on run and sm (70 + 3 x 20 + padding).
 */
export const CI_EDGE_KINDS: Record<string, Kind> = {
  'idp-run': 'identity', 'run-sm': 'identity', 'sm-run': 'identity', 'sm-idp': 'control', 'run-tgt': 'access',
}

export function ciLayouts(labels: { issue: string; verify: string; api: string }): { wide: FlowLayout; narrow: FlowLayout } {
  return {
    wide: {
      w: 980, h: 450,
      boxes: {
        idp: { x: 400, y: 20, w: 320, h: 76 },
        run: { x: 40, y: 150, w: 280, h: 156 },
        sm: { x: 440, y: 150, w: 280, h: 156 },
        tgt: { x: 760, y: 300, w: 200, h: 96 },
      },
      zones: [
        { d: 'svc', x: 388, y: 8, w: 344, h: 100 },
        { d: 'cp', x: 28, y: 138, w: 304, h: 180 },
        { d: 'idira', x: 428, y: 138, w: 304, h: 180 },
        { d: 'svc', x: 748, y: 288, w: 224, h: 120 },
      ],
      edges: {
        'idp-run': 'M 400,58 L 180,58 L 180,150',
        'run-sm': 'M 320,200 L 440,200',
        'sm-run': 'M 440,262 L 320,262',
        'sm-idp': 'M 580,150 L 580,96',
        'run-tgt': 'M 180,306 L 180,348 L 760,348',
      },
      labels: [
        { x: 290, y: 58, text: labels.issue },
        { x: 664, y: 123, text: labels.verify },
        { x: 470, y: 420, text: labels.api },
      ],
    },
    narrow: {
      w: 360, h: 740, title: 14,
      boxes: {
        idp: { x: 30, y: 30, w: 300, h: 76 },
        run: { x: 40, y: 150, w: 280, h: 156 },
        sm: { x: 40, y: 380, w: 280, h: 156 },
        tgt: { x: 80, y: 610, w: 200, h: 96 },
      },
      edges: {
        'idp-run': 'M 180,106 L 180,150',
        'run-sm': 'M 160,306 L 160,380',
        'sm-run': 'M 200,380 L 200,306',
        'sm-idp': 'M 320,430 C 352,430 352,68 330,68',
        'run-tgt': 'M 40,228 C 8,228 8,658 80,658',
      },
    },
  }
}
