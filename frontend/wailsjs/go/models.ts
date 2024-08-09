export namespace credentials {
  export class Credential {
    id: number;
    label: string;
    location: string;
    method: string;
    macaroon: string;
    preimage: string;
    invoice: string;
    // Go type: time
    created_at: any;
    type: string;

    static createFrom(source: any = {}) {
      return new Credential(source);
    }

    constructor(source: any = {}) {
      if ('string' === typeof source) source = JSON.parse(source);
      this.id = source['id'];
      this.label = source['label'];
      this.location = source['location'];
      this.method = source['method'];
      this.macaroon = source['macaroon'];
      this.preimage = source['preimage'];
      this.invoice = source['invoice'];
      this.created_at = this.convertValues(source['created_at'], null);
      this.type = source['type'];
    }

    convertValues(a: any, classs: any, asMap: boolean = false): any {
      if (!a) {
        return a;
      }
      if (a.slice && a.map) {
        return (a as any[]).map((elem) => this.convertValues(elem, classs));
      } else if ('object' === typeof a) {
        if (asMap) {
          for (const key of Object.keys(a)) {
            a[key] = new classs(a[key]);
          }
          return a;
        }
        return new classs(a);
      }
      return a;
    }
  }
}
