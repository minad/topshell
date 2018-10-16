package com.github.ahnfelt.topshell.language

import com.github.ahnfelt.topshell.language.Syntax._

import scala.scalajs.js.JSON

object Pretty {

    def showType(t : Type) = t match {
        case TVariable(id) => "_" + id
        case TParameter(name) => name
        case TConstructor(name) => name
        case TSymbol(name) => JSON.stringify(name)
        case TRecord(fields) =>
            "{" + fields.map(b => b.name + ": " + showScheme(b.scheme, true)).mkString(", ") + "}"
        case TApply(TApply(TApply(TConstructor(o), TSymbol(l)), t1), t2) if o == "." || o == ".?" =>
            t2 + o + l + ": " + t1 // Escape label
        case TApply(TApply(TConstructor("=="), a), b) => a + " == " + b
        case TApply(TApply(TConstructor("->"), a@TApply(TApply(TConstructor("->"), _), _)), b) => "(" + a + ") -> " + b
        case TApply(TApply(TConstructor("->"), a), b) => a + " -> " + b
        case TApply(constructor, argument : TApply) => constructor + " (" + argument + ")"
        case TApply(constructor, argument) => constructor + " " + argument
    }

    def showScheme(scheme : Scheme, explicit : Boolean) = {
        (if(explicit) scheme.parameters.map(_.name + " => ").mkString else "") +
        scheme.generalized + scheme.constraints.map(" | " + _).mkString
    }

    private val alphabet = Stream.from(0).flatMap(i => Stream.range('a', ('z' + 1).toChar).map(_ -> i)).map {
        case (c, 0) => c.toString
        case (c, i) => c + i.toString
    }

    def renameParameterNames(scheme : Scheme, expand : Int => Option[Type]) = {
        val used = usedParameterNames(scheme.generalized, expand)
        val alpha = alphabet.filterNot(used)
        val pairs = scheme.parameters.map(_.name).zip(alpha).map { case (k, v) => TParameter(k) -> TParameter(v) }
        val replacement = pairs.toMap[Type, Type]
        val constraints = scheme.constraints.map(replace(_, replacement, expand))
        val generalized = replace(scheme.generalized, replacement, expand)
        val names = pairs.map(_._2.name)
        val kinds = scheme.parameters.map(_.kind)
        Scheme(names.zip(kinds).map(TypeParameter.tupled), constraints, generalized)
    }

    def usedParameterNames(search : Type, expand : Int => Option[Type]) : Set[String] = search match {
        case TVariable(id) => expand(id).map(usedParameterNames(_, expand)).getOrElse(Set.empty)
        case TParameter(name) => Set(name)
        case TConstructor(name) => Set.empty
        case TSymbol(name) => Set.empty
        case TApply(constructor, argument) =>
            usedParameterNames(constructor, expand) ++ usedParameterNames(argument, expand)
        case TRecord(fields) =>
            fields.map(f => f.scheme.parameters.map(_.name).toSet ++ usedParameterNames(f.scheme.generalized, expand)).
                fold(Set.empty)(_ ++ _)
    }

    def replace(search : Type, replacement : Map[Type, Type], expand : Int => Option[Type]) : Type = search match {
        case t if replacement.contains(t) =>
            replacement(t)
        case TVariable(id) =>
            expand(id).map(replace(_, replacement, expand)).getOrElse(search)
        case TParameter(name) =>
            search
        case TConstructor(name) =>
            search
        case TSymbol(name) =>
            search
        case TApply(constructor, argument) =>
            TApply(replace(constructor, replacement, expand), replace(argument, replacement, expand))
        case TRecord(fields) =>
            TRecord(fields.map { f =>
                // Shadow parameters
                f.copy(scheme = f.scheme.copy(
                    constraints = f.scheme.constraints.map(replace(_, replacement, expand)),
                    generalized = replace(f.scheme.generalized, replacement, expand)
                ))
            })
    }

    def freeInScheme(theScheme : Scheme) : List[Int] = {
        theScheme.constraints.flatMap(freeInType) ++ freeInType(theScheme.generalized)
    }

    def freeInType(theType : Type) : List[Int] = (theType match {
        case TVariable(id) => List(id)
        case TParameter(name) => List()
        case TConstructor(name) => List()
        case TSymbol(name) => List()
        case TApply(constructor, argument) => freeInType(constructor) ++ freeInType(argument)
        case TRecord(fields) => fields.flatMap(f => freeInScheme(f.scheme))
    }).distinct

    // Type variables that are *fully determined* (in the type class with functional dependencies sense)
    // To avoid inferring: f : a | b.y: a = (Json.toAny (Json.read "{}")).y
    // But still infer: g : a -> b | a.y: c | c.z: b = x -> x.y.z
    def determinedInConstraint(constraint : Type) : List[Int] = constraint match {
        case FieldConstraint(_, _, t, _) => freeInType(t)
        case _ => List()
    }

}
