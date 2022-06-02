const Project = require('@mea-energy-sdk/models/Project')
const Client = require('@mea-energy-sdk/models/Client')
const AllowedMeter = require('@mea-energy-sdk/models/AllowedMeter')
const Sequelize = require('sequelize')

module.exports.client = async (req, res, next) => {
    try {
        const response = await Client.findAll({
            attributes: [
                'clientId',
                ['name', 'clientName'],
                [Sequelize.fn('COUNT', Sequelize.col('projects.projectId')), 'projectCount'],
                [Sequelize.fn('COUNT', Sequelize.col('projects.allowedMeters.allowedMeterId')), 'allowedMetersCount'],
            ],
            include: [
                {
                    model: Project,
                    attributes: [],
                    include: [
                        {
                            model: AllowedMeter,
                            attributes: [],
                        },
                    ],
                },
            ],
            raw: true,
            group: ['client.clientId', 'client.name'],
        })
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

module.exports.sumMonth = async (req, res, next) => {
    try {
        const { year } = req.query
        if (!year) return next([400, 'MISSING_YEAR'])
        const response = await sequelize.query(
            `
                with tblclient as (select clientId  ,clientCode , name from client),
                tblCnt as (
                    select clientCode ,month(createdDate) month , count(recordno) cnt from accessLogging
                    where YEAR(createdDate) = ${parseInt(year)} and clientCode is not null
                    group by clientCode ,month(createdDate)
                ),
                tblPivot as (
                        select clientCode,   
                        [1] M1,[2] M2,[3] M3,[4] M4,[5] M5,[6] M6,[7] M7,[8] M8,[9] M9,[10] M10,[11] M11,[12] M12
                        from  
                        (
                            select clientCode, month , cnt   
                            from tblCnt
                        ) as SourceTable  
                        pivot 
                        (  
                            avg(cnt)  
                            for month in ([1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12])  
                        ) as PivotTable
                )
                select client.clientId, client.name as clientName,
                isnull(M1, 0) as countM1, isnull(M2, 0) as countM2, isnull(M3, 0) as countM3, 
                isnull(M4, 0) as countM4, isnull(M5, 0) as countM5, isnull(M6, 0) as countM6, 
                isnull(M7, 0) as countM7, isnull(M8, 0) as countM8, isnull(M9, 0) as countM9, 
                isnull(M10, 0) as countM10, isnull(M11, 0) as countM11, isnull(M12, 0) as countM12
                from tblclient client
                left join tblPivot p on client.clientCode = p.clientCode;
            `,
            {
                type: sequelize.QueryTypes.SELECT,
            },
        )
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

module.exports.sumYear = async (req, res, next) => {
    try {
        const { yearStart, yearEnd } = req.query
        if (!yearStart) return next([400, 'MISSING_YEAR_START'])
        if (!yearEnd) return next([400, 'MISSING_YEAR_END'])
        const yearStartNum = parseInt(yearStart)
        const yearEndNum = parseInt(yearEnd)
        if (yearStartNum > yearEndNum) return next([400, 'Start date must be less than the end date.'])
        if (yearEndNum - yearStartNum > 4)
            return next([400, 'The length of the start date to the end date must be less than or equal to 5.'])
        const sqlArr1 = []
        const sqlArr2 = []
        const sqlArr3 = []
        const sqlArr4 = []
        for (let index = yearStartNum; index <= yearEndNum; index++) {
            sqlArr1.push(`YEAR(createdDate) = ${index}`)
            sqlArr2.push(`[${index}] "${index}"`)
            sqlArr3.push(`[${index}]`)
            sqlArr4.push(`ISNULL("${index}", 0) as "${index}"`)
        }
        const result = await sequelize.query(
            `
                with tblclient as (select clientId  ,clientCode , name from client),
                tblCnt as (
                    select clientCode ,year(createdDate) year , count(recordno) cnt from accessLogging
                    where (${sqlArr1.join(' OR ')}) and clientCode is not null
                    group by clientCode ,year(createdDate)
                ),
                tblPivot as (
                        SELECT clientCode,
                        ${sqlArr2.join()}
                        FROM
                        (
                            SELECT clientCode, year, cnt
                            FROM tblCnt
                        ) AS SourceTable  
                        PIVOT
                        (
                            AVG(cnt)
                            FOR year IN (${sqlArr3.join()})
                        ) AS PivotTable
                )
                select client.clientId, client.name as clientName,
                ${sqlArr4.join()}
                from tblclient client
                left join tblPivot p on client.clientCode = p.clientCode
            `,
            {
                type: sequelize.QueryTypes.SELECT,
            },
        )
        const response = []
        result.forEach((element) => {
            const { clientId, clientName, ...logCount } = element
            response.push({ clientId, clientName, logCount })
        })
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

module.exports.sumMonthByMethod = async (req, res, next) => {
    try {
        const { year } = req.query
        if (!year) return next([400, 'MISSING_YEAR'])
        const response = await sequelize.query(
            `
                with tblclient as (select clientId  ,clientCode , name from client),
                tblCnt as (
                    select clientCode, method, month(createdDate) month , count(recordno) cnt from accessLogging
                    where YEAR(createdDate) = ${parseInt(year)} and clientCode is not null
                    group by clientCode, method, month(createdDate)
                ),
                tblPivot as (
                    select clientCode, method,
                    [1] M1,[2] M2,[3] M3,[4] M4,[5] M5,[6] M6,[7] M7,[8] M8,[9] M9,[10] M10,[11] M11,[12] M12
                    from  
                    (
                        select clientCode, method, month , cnt   
                        from tblCnt
                    ) as SourceTable  
                    pivot 
                    (  
                        avg(cnt)  
                        for month in ([1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12])  
                    ) as PivotTable
                )
                select client.clientId, client.name as clientName, method,
                isnull(M1, 0) as countM1, isnull(M2, 0) as countM2, isnull(M3, 0) as countM3, 
                isnull(M4, 0) as countM4, isnull(M5, 0) as countM5, isnull(M6, 0) as countM6, 
                isnull(M7, 0) as countM7, isnull(M8, 0) as countM8, isnull(M9, 0) as countM9, 
                isnull(M10, 0) as countM10, isnull(M11, 0) as countM11, isnull(M12, 0) as countM12
                from tblclient client
                left join tblPivot p on client.clientCode = p.clientCode;
            `,
            {
                type: sequelize.QueryTypes.SELECT,
            },
        )
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}

module.exports.sumMonthByMeter = async (req, res, next) => {
    try {
        const { year } = req.query
        if (!year) return next([400, 'MISSING_YEAR'])
        const result = await sequelize.query(
            `
            with tblclient as (select c.clientId, c.name from client c),
            tblCnt as (
                select clientId,
                    [1] M1,[2] M2,[3] M3,[4] M4,[5] M5,[6] M6,[7] M7,[8] M8,[9] M9,[10] M10,[11] M11,[12] M12
                from
                (
                    select p.clientId,month(a.createdDate) month, count(a.allowedMeterId) cnt 
                    from allowedMeter a
                    join project p
                    on a.projectId = p.projectId
                    where year(a.createdDate) = ${parseInt(year)} and p.clientId is not null
                    group by p.clientId, month(a.createdDate)
                ) as SourceTable
                pivot 
                (  
                    sum(cnt)  
                    for month in ([1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12])  
                ) as PivotTable
            )
            select client.clientId, client.name as clientName,
            isnull(M1, 0) as countM1, isnull(M2, 0) as countM2, isnull(M3, 0) as countM3, 
            isnull(M4, 0) as countM4, isnull(M5, 0) as countM5, isnull(M6, 0) as countM6, 
            isnull(M7, 0) as countM7, isnull(M8, 0) as countM8, isnull(M9, 0) as countM9, 
            isnull(M10, 0) as countM10, isnull(M11, 0) as countM11, isnull(M12, 0) as countM12
            from tblclient client
            join tblCnt cnt on client.clientId = cnt.clientId;
            `,
            {
                type: sequelize.QueryTypes.SELECT,
            },
        )
        return res.jsonp(result)
    } catch (ex) {
        return next(ex)
    }
}

module.exports.sumMonthSendOutage = async (req, res, next) => {
    try {
        const { year } = req.query
        if (!year) return next([400, 'MISSING_YEAR'])
        const result = await sequelize.query(
            `
            SELECT clientId,name AS clientName,
            isnull([1], 0) as countM1, isnull([2], 0) as countM2, isnull([3], 0) as countM3, 
            isnull([4], 0) as countM4, isnull([5], 0) as countM5, isnull([6], 0) as countM6, 
            isnull([7], 0) as countM7, isnull([8], 0) as countM8, isnull([9], 0) as countM9, 
            isnull([10], 0) as countM10, isnull([11], 0) as countM11, isnull([12], 0) as countM12
            FROM(
                SELECT c.clientId, c.name, MONTH(s.notifyDate) MONTH, COUNT(s.sendOutageId) count FROM sendOutage s
                JOIN allowedMeter a
                ON a.ca = s.ca AND a.meterNo = s.meterNo
                JOIN project p
                ON a.projectId = p.projectId
                JOIN client c
                ON p.clientId = c.clientId
                GROUP BY c.clientId, c.name,MONTH(s.notifyDate)
                ) AS tblcnt
            PIVOT(SUM(count)
                    FOR MONTH IN ([1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12])
                ) AS tblpivot
            `,
            {
                type: sequelize.QueryTypes.SELECT,
            },
        )
        return res.jsonp(result)
    } catch (ex) {
        return next(ex)
    }
}

module.exports.sumYearSendOutage = async (req, res, next) => {
    try {
        const { yearStart, yearEnd } = req.query
        if (!yearStart) return next([400, 'MISSING_YEAR_START'])
        if (!yearEnd) return next([400, 'MISSING_YEAR_END'])
        const yearStartNum = parseInt(yearStart)
        const yearEndNum = parseInt(yearEnd)
        if (yearStartNum > yearEndNum) return next([400, 'Start date must be less than the end date.'])
        if (yearEndNum - yearStartNum > 4)
            return next([400, 'The length of the start date to the end date must be less than or equal to 5.'])
        const sqlArr1 = []
        const sqlArr2 = []
        for (let index = yearStartNum; index <= yearEndNum; index++) {
            sqlArr1.push(`[${index}]`)
            sqlArr2.push(`ISNULL([${index}], 0) as [${index}]`)
        }
        const result = await sequelize.query(
            `
            SELECT clientId, name AS clientName,
                ${sqlArr2.join()}
            FROM(
                SELECT c.clientId, c.name, YEAR(s.notifyDate) YEAR, COUNT(s.sendOutageId) count 
                FROM sendOutage s
                JOIN allowedMeter a
                ON a.ca = s.ca AND a.meterNo = s.meterNo
                JOIN project p
                ON a.projectId = p.projectId
                JOIN client c
                ON p.clientId = c.clientId
                WHERE YEAR(s.notifyDate) BETWEEN ${yearStartNum} AND ${yearEndNum}
                GROUP BY c.clientId, c.name,YEAR(s.notifyDate)
            ) AS tblcnt
            PIVOT(SUM(count)
                FOR YEAR IN (${sqlArr1.join()})
            ) AS tblpivot
            `,
            {
                type: sequelize.QueryTypes.SELECT,
            },
        )
        const response = []
        result.map((value) => {
            const { clientId, clientName, ...notifyCount } = value
            response.push({ clientId, clientName, notifyCount })
        })
        return res.jsonp(response)
    } catch (ex) {
        return next(ex)
    }
}
