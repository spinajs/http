import moment from 'moment';

export abstract class ArgHydrator {
    public abstract async hydrate(input: any): Promise<any>;
}

/**
 * Trying to convert incoming date time or unix timestamp 
 * to native DateTime
 */
export class DateHydrator extends ArgHydrator {

    constructor(protected dateFormat?: string) {
        super();
    }

    public async hydrate(input: any) {

        if (isNaN(input)) {
            return new Date(input);
        }

        return new Date(parseInt(input) * 1000);
    }
}

/**
 * Trying to convert incoming date time or unix timestamp 
 * to momentjs date object
 */
export class MomentHydrator extends ArgHydrator
{
    constructor(protected dateFormat?: string) {
        super();
    }

    public async hydrate(input: any) {

        if (isNaN(input)) {
            const dt = moment(input, this.dateFormat ?? moment.ISO_8601)
            if (dt.isValid()) {
                return dt;
            }

            return null;
        }

        const uDt = moment.unix(parseInt(input));
        if(uDt.isValid()){
            return uDt;
        }

        return null;
    }
}
