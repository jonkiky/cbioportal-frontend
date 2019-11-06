import * as React from 'react';
import { If, Then, Else } from 'react-if';
import {observer} from "mobx-react";
import * as _ from 'lodash';
import {
    IClinicalGroupMatch, IGenomicGroupMatch, IGenomicMatch, IDetailedTrialMatch, IArmMatch
} from "../../../shared/model/MatchMiner";
import styles from './style/trialMatch.module.scss';
import { computed } from "mobx";
import LazyMobXTable from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import SampleManager from "../SampleManager";
import DefaultTooltip, { placeArrowBottomLeft } from "../../../public-lib/components/defaultTooltip/DefaultTooltip";
import { getAgeRangeDisplay } from "./TrialMatchTableUtils";

export type ITrialMatchProps = {
    sampleManager: SampleManager | null;
    detailedTrialMatches: IDetailedTrialMatch[];
    containerWidth: number;
}

enum ColumnKey {
    TITLE = 'Title',
    MATCHING_CRITERIA = 'Matching Criteria',
    STATUS = 'Status',
}

enum ColumnWidth {
    STATUS = 140
}

class TrialMatchTableComponent extends LazyMobXTable<IDetailedTrialMatch> {

}

@observer
export default class TrialMatchTable extends React.Component<ITrialMatchProps> {

    @computed
    get columnWidths() {
        return {
            [ColumnKey.STATUS]: ColumnWidth.STATUS,
            [ColumnKey.TITLE]: 0.35 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.MATCHING_CRITERIA]: 0.65 * (this.props.containerWidth - ColumnWidth.STATUS)
        };
    }

    private _columns = [{
        name: ColumnKey.TITLE,
        render: (trial: IDetailedTrialMatch) => (
            <div>
                <If condition={trial.protocolNo.length > 0}>
                    <div><a target="_blank" href={"https://www.mskcc.org/cancer-care/clinical-trials/" + trial.protocolNo}>{trial.protocolNo}</a></div>
                </If>
                <If condition={trial.nctId.length > 0}>
                    <div><a target="_blank" href={"https://clinicaltrials.gov/ct2/show/" + trial.nctId}>{trial.nctId}</a></div>
                </If>
                <div>{trial.shortTitle}</div>
                {trial.principalInvestigator &&
                    <div className={styles.icon}>
                        <i className={`fa fa-user-md ${styles.marginRight}`} aria-hidden="true"></i>
                        <If condition={!_.isUndefined(trial.principalInvestigator.url)}>
                            <Then>
                                <a target="_blank" href={trial.principalInvestigator.url}>{trial.principalInvestigator.full_name}</a>
                            </Then>
                            <Else>
                                {trial.principalInvestigator.full_name}
                            </Else>
                        </If>
                        <If condition={!_.isUndefined(trial.principalInvestigator.email)}>
                            <a href={"mailto:" + trial.principalInvestigator.email}><i className={`fa fa-envelope-o ${styles.marginLeft}`} aria-hidden="true"></i></a>
                        </If>
                    </div>
                }
            </div>
        ),
        width: this.columnWidths[ColumnKey.TITLE]
    }, {
        name: ColumnKey.MATCHING_CRITERIA,
        render: (trial: IDetailedTrialMatch) => (
            <div>
                {trial.matches.map((armMatch: IArmMatch, index: number) => (
                    <div>
                        <div className={styles.matchInfoContainer}>
                            <div className={styles.sampleIdsContainer}>
                                {this.getSampleIdIcons(armMatch.sampleIds)}
                            </div>
                            <div className={styles.genomicInfoContainer}>
                                <div>
                                    {armMatch.matches.map((clinicalGroupMatch: IClinicalGroupMatch, cgIndex:number) => (
                                        <div className={styles.criteriaContainer}>
                                            {this.getGenomicMatch(clinicalGroupMatch)}
                                            {this.getClinicalMatch(clinicalGroupMatch)}
                                            <If condition={cgIndex < armMatch.matches.length - 1}><hr className={styles.criteriaHr}/></If>
                                        </div>
                                    ))}
                                </div>
                                 <If condition={armMatch.armDescription !== ''}>
                                    <div style={{ marginTop: 7, marginBottom: 3, width: '75%' }}>
                                        <span>Arm: {armMatch.armDescription}</span>
                                    </div>
                                </If>
                                <If condition={armMatch.drugs.length > 0}>
                                    <div>
                                        <span><img src={require("../../../globalStyles/images/drug.png")} style={{ width: 18, marginTop: -5 }} alt="drug icon"/> <b>{armMatch.drugs.join(', ')}</b></span>
                                    </div>
                                </If>
                            </div>
                        </div>
                        <If condition={index < trial.matches.length - 1}><hr className={styles.criteriaHr}/></If>
                    </div>
                ))}
            </div>
        ),
        width: this.columnWidths[ColumnKey.MATCHING_CRITERIA]
    }, {
        name: ColumnKey.STATUS,
        render: (trial: IDetailedTrialMatch) => (
            <div style={{ margin: '20% 0 20% 0' }}>
                <span className={styles.statusBackground}>{trial.status}</span>
            </div>
        ),
        sortBy: (trial: IDetailedTrialMatch) => trial.status,
        width: this.columnWidths[ColumnKey.STATUS]
    }];

    public getSampleIdIcons(sampleIds: string[]) {
        let sortedSampleIds = sampleIds;
        if (sampleIds.length > 1) {
            const sampleOrder = this.props.sampleManager!.getSampleIdsInOrder();
            sortedSampleIds = sampleOrder.filter( ( sampleId: string ) => sampleIds.includes( sampleId ) );
        }
        return (
            <div>
                {sortedSampleIds.map((sampleId: string) => (
                    <span className={styles.genomicSpan}>
                        {this.props.sampleManager!.getComponentForSample(sampleId, 1, '')}
                    </span>
                ))}
            </div>
        );
    }

    public getClinicalMatch(clinicalGroupMatch: IClinicalGroupMatch) {
        return (
            <div className={styles.firstRight}>
                <span className={styles.secondLeft}>{getAgeRangeDisplay(clinicalGroupMatch.trialAgeNumerical)}</span>
                <span className={styles.secondRight}>
                    {clinicalGroupMatch.trialOncotreePrimaryDiagnosis.positive.join(', ')}
                    {clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative.length > 0 &&
                        <span>
                            <b> except in </b>
                            <If condition={clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative.length < 4}>
                                <Then>
                                    <span>{clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative.join(', ').replace(/,(?!.*,)/gmi, ' and')}</span>
                                </Then>
                                <Else>
                                     <DefaultTooltip
                                         placement='bottomLeft'
                                         trigger={['hover', 'focus']}
                                         overlay={this.tooltipClinicalContent(clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative)}
                                         destroyTooltipOnHide={true}
                                         onPopupAlign={placeArrowBottomLeft}>
                                         <span>{clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative.length + ` cancer types`}</span>
                                    </DefaultTooltip>
                                </Else>
                            </If>
                        </span>
                    }
                </span>
            </div>
        );
    }

    public getGenomicMatch(clinicalGroupMatch: IClinicalGroupMatch) {
        return (
            <div className={styles.firstLeft}>
                {clinicalGroupMatch.matches.MUTATION.map((genomicGroupMatch: IGenomicGroupMatch) => (
                    <div>
                        {this.getPatientMatchedGenomicInfo(genomicGroupMatch)}
                    </div>
                ))}
                {clinicalGroupMatch.matches.MSI.length > 0 &&
                    <div>Tumor is MSI-H</div>
                }
                {clinicalGroupMatch.matches.CNA.map((genomicGroupMatch: IGenomicGroupMatch) => (
                    <div>
                        {this.getGenomicAlteration(genomicGroupMatch)}
                    </div>
                ))}
                {clinicalGroupMatch.matches.WILDTYPE.map((genomicGroupMatch: IGenomicGroupMatch) => (
                    <div>
                        {this.getGenomicAlteration(genomicGroupMatch)}
                    </div>
                ))}
                { (clinicalGroupMatch.notMatches.MUTATION.length > 0 || clinicalGroupMatch.notMatches.CNA.length > 0 ) &&
                    <div>
                        <span className={styles.genomicSpan}>{this.getDescriptionForNotMatches(clinicalGroupMatch.notMatches.MUTATION.concat(clinicalGroupMatch.notMatches.CNA), 3, 'Negative for alterations in', '')}</span>
                        <DefaultTooltip
                            placement='bottomLeft'
                            trigger={['hover', 'focus']}
                            overlay={this.tooltipGenomicContent(clinicalGroupMatch.notMatches.MUTATION.concat(clinicalGroupMatch.notMatches.CNA))}
                            destroyTooltipOnHide={false}
                            onPopupAlign={placeArrowBottomLeft}>
                            <i className={'fa fa-comment-o ' + styles.icon}></i>
                        </DefaultTooltip>
                    </div>

                }
                { clinicalGroupMatch.notMatches.MSI.length > 0 &&
                    <div>Tumor is not MSI-H</div>
                }
                { clinicalGroupMatch.notMatches.WILDTYPE.length > 0 &&
                    <div>
                        <span className={styles.genomicSpan}>{this.getDescriptionForNotMatches(clinicalGroupMatch.notMatches.WILDTYPE, 3, 'Tumor doesn\'t have', 'defined by the trial')}</span>
                        <DefaultTooltip
                            placement='bottomLeft'
                            trigger={['hover', 'focus']}
                            overlay={this.tooltipGenomicContent(clinicalGroupMatch.notMatches.WILDTYPE)}
                            destroyTooltipOnHide={false}
                            onPopupAlign={placeArrowBottomLeft}>
                            <i className={'fa fa-comment-o ' + styles.commentIcon}></i>
                        </DefaultTooltip>
                    </div>
                }
            </div>
        );
    }

    public getPatientMatchedGenomicInfo(genomicGroupMatch: IGenomicGroupMatch) {
        return (
            <div>
                {genomicGroupMatch.matches.map((genomicMatch: IGenomicMatch) => (
                    <div><b>{genomicMatch.trueHugoSymbol}</b> {genomicMatch.trueProteinChange}</div>
                ))}
            </div>
        );
    }

    public getGenomicAlteration(genomicGroupMatch: IGenomicGroupMatch) {
        return (
            <div>{`${genomicGroupMatch.genomicAlteration} `}</div>
        );
    }

    public tooltipGenomicContent(data: IGenomicGroupMatch[]) {
        return (
            <div className={styles.tooltip}>
                {data.map((genomicGroupMatch: IGenomicGroupMatch) => (
                    <div className={styles.genomicSpan}>
                        <b>Not </b>{`${genomicGroupMatch.genomicAlteration.replace(/!/g, '')} `}
                    </div>
                ))}
            </div>
        );
    }

    public tooltipClinicalContent(data: string[]) {
        return (
            <div className={styles.tooltip}>
                <ul className={styles.alterationUl}>
                    {data.map((cancerType: string) => (
                        <li>{cancerType}</li>
                    ))}
                </ul>
            </div>
        );
    }

    public getDescriptionForNotMatches(matches: IGenomicGroupMatch[], threshold: number, preContent: string, postContent: string) {
        const hugoSymbolSet = new Set([...matches].map(x => x.genomicAlteration.split(' ')[0]));
        let genomicAlterationContent = '';
        if (hugoSymbolSet.size <= threshold) {
            genomicAlterationContent = [...hugoSymbolSet].join(', ');
        } else {
            genomicAlterationContent = `${hugoSymbolSet.size} genes`;
        }
        return `${preContent} ${genomicAlterationContent} ${postContent}`;
    }

    render() {
        return (
            <div>
                <TrialMatchTableComponent
                    data={this.props.detailedTrialMatches}
                    columns={this._columns}
                    showCopyDownload={false}
                />
                <div className={styles.powered}>
                    Powered by <a href="https://matchminer.org/" target="_blank">MatchMiner</a>
                </div>
            </div>
        )
    }
}
